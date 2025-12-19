package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/chromedp/chromedp"
	"github.com/joho/godotenv"

	// BURASI DEĞİŞTİ: lib/pq yerine pgx stdlib kullanıyoruz
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/robfig/cron/v3"
)

type Manga struct {
	ID          int       `json:"id"`
	Title       string    `json:"title"`
	Chapter     string    `json:"chapter"`
	CoverImage  string    `json:"cover_image"`
	PublishedAt string    `json:"published_at"`
	Link        string    `json:"link"`
	ChapterLink string    `json:"chapter_link"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type MangaChange struct {
	Type    string // "added", "removed", "updated"
	Manga   Manga
	Changes map[string]interface{}
}

var (
	db        *sql.DB
	changeLog []MangaChange
)

func main() {
	var err error

	// .env dosyasını yükle
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️ .env dosyası bulunamadı, ortam değişkenleri kontrol ediliyor...")
	}

	// Supabase bağlantı stringi oluştur
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		log.Fatal("❌ DATABASE_URL environment variable gerekli! Supabase'den kopyala.")
	}

	// BURASI DEĞİŞTİ: "postgres" yerine "pgx" kullanıyoruz
	// pgx, modern PostgreSQL sürücüsüdür ve bağlantı sorunlarını daha iyi yönetir.
	db, err = sql.Open("pgx", connStr)
	if err != nil {
		log.Fatalf("❌ Database sürücü hatası: %v", err)
	}
	defer db.Close()

	// Bağlantıyı test et
	if err = db.Ping(); err != nil {
		log.Fatalf("❌ Database ping hatası (Bağlantı URL'ini kontrol et): %v", err)
	}

	fmt.Println("✓ Supabase PostgreSQL'e (pgx) bağlandı")

	// Tabloyu oluştur
	if err := ensureTable(); err != nil {
		log.Fatalf("Tablo oluşturma hatası: %v", err)
	}

	// İlk scraping'i yap
	fmt.Println("\n=== İlk Scraping Başlıyor ===")
	if err := scrapingCycle(); err != nil {
		log.Fatalf("Scraping hatası: %v", err)
	}

	// Scheduler kur - 30 dakikada bir çalıştır
	c := cron.New()
	c.AddFunc("0 */30 * * * *", func() {
		fmt.Println("\n=== Scheduled Scraping Başlıyor ===")
		if err := scrapingCycle(); err != nil {
			log.Printf("❌ Scraping hatası: %v", err)
		}
	})
	c.Start()

	fmt.Println("\n✓ Scheduler başlatıldı (30 dakikada bir scraping yapılacak)")
	fmt.Println("📌 Çıkmak için Ctrl+C tuşlayın")

	// Sunucu açık tut
	select {}
}

func ensureTable() error {
	createSQL := `
    CREATE TABLE IF NOT EXISTS mangas (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        chapter TEXT,
        cover_image TEXT,
        published_at TEXT,
        link TEXT UNIQUE NOT NULL,
        chapter_link TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_link ON mangas(link);
    CREATE INDEX IF NOT EXISTS idx_updated_at ON mangas(updated_at);
    `

	_, err := db.Exec(createSQL)
	if err != nil {
		return err
	}
	fmt.Println("✓ Database tablo hazır")
	return nil
}

func scrapingCycle() error {
	changeLog = nil

	// Yeni veriyi scrape et
	fmt.Println("\n📥 Veriler scrape ediliyor...")
	newMangas, err := scrapeMangaItems()
	if err != nil {
		return fmt.Errorf("scraping hatası: %w", err)
	}
	fmt.Printf("✓ %d manga bulundu\n", len(newMangas))

	// Veritabanındaki mevcut veriyi al
	fmt.Println("\n📂 Veritabanındaki veriler yükleniyor...")
	oldMangas, err := getOldMangas()
	if err != nil {
		return fmt.Errorf("veritabanı sorgulama hatası: %w", err)
	}
	fmt.Printf("✓ %d manga veritabanında bulundu\n", len(oldMangas))

	// Veri karşılaştır ve işlem yap
	fmt.Println("\n🔄 Veriler karşılaştırılıyor...")
	compareAndUpdate(oldMangas, newMangas)

	// Değişiklikleri logla
	fmt.Println("\n📋 Değişiklik Özeti:")
	printChangelog()

	return nil
}

func getOldMangas() ([]Manga, error) {
	rows, err := db.Query("SELECT id, title, chapter, cover_image, published_at, link, chapter_link, created_at, updated_at FROM mangas")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var mangas []Manga
	for rows.Next() {
		var m Manga
		if err := rows.Scan(&m.ID, &m.Title, &m.Chapter, &m.CoverImage, &m.PublishedAt, &m.Link, &m.ChapterLink, &m.CreatedAt, &m.UpdatedAt); err != nil {
			return nil, err
		}
		mangas = append(mangas, m)
	}

	return mangas, rows.Err()
}

func compareAndUpdate(oldMangas, newMangas []Manga) {
	// URL'e göre map oluştur
	newMap := make(map[string]Manga)
	for _, m := range newMangas {
		newMap[m.Link] = m
	}

	oldMap := make(map[string]Manga)
	for _, m := range oldMangas {
		oldMap[m.Link] = m
	}

	// Yeni manga ekle veya güncelle
	for link, newManga := range newMap {
		if oldManga, exists := oldMap[link]; exists {
			// Kontrol et: değişti mi?
			if hasChanges(oldManga, newManga) {
				// Güncelle
				_, err := db.Exec(
					"UPDATE mangas SET title=$1, chapter=$2, cover_image=$3, published_at=$4, chapter_link=$5, updated_at=$6 WHERE link=$7",
					newManga.Title, newManga.Chapter, newManga.CoverImage, newManga.PublishedAt, newManga.ChapterLink, time.Now(), link,
				)
				if err != nil {
					log.Printf("❌ Güncelleme hatası %s: %v", link, err)
				} else {
					changeLog = append(changeLog, MangaChange{
						Type:  "updated",
						Manga: newManga,
					})
					fmt.Printf("  ✎ Güncellendi: %s\n", newManga.Title)
				}
			}
			delete(oldMap, link)
		} else {
			// Yeni manga ekle
			_, err := db.Exec(
				"INSERT INTO mangas (title, chapter, cover_image, published_at, link, chapter_link, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
				newManga.Title, newManga.Chapter, newManga.CoverImage, newManga.PublishedAt, newManga.Link, newManga.ChapterLink, time.Now(), time.Now(),
			)
			if err != nil {
				log.Printf("❌ Ekleme hatası %s: %v", link, err)
			} else {
				changeLog = append(changeLog, MangaChange{
					Type:  "added",
					Manga: newManga,
				})
				fmt.Printf("  ➕ Eklendi: %s\n", newManga.Title)
			}
		}
	}

	// Kalan eski manga'ları sil
	for link, manga := range oldMap {
		_, err := db.Exec("DELETE FROM mangas WHERE link=$1", link)
		if err != nil {
			log.Printf("❌ Silme hatası %s: %v", link, err)
		} else {
			changeLog = append(changeLog, MangaChange{
				Type:  "removed",
				Manga: manga,
			})
			fmt.Printf("  ➖ Silindi: %s\n", manga.Title)
		}
	}
}

func hasChanges(old, new Manga) bool {
	return old.Chapter != new.Chapter ||
		old.Title != new.Title ||
		old.CoverImage != new.CoverImage ||
		old.PublishedAt != new.PublishedAt ||
		old.ChapterLink != new.ChapterLink
}

func printChangelog() {
	if len(changeLog) == 0 {
		fmt.Println("  ℹ️  Değişiklik yok - tümü aynı!")
		return
	}

	added := 0
	removed := 0
	updated := 0

	for _, change := range changeLog {
		switch change.Type {
		case "added":
			added++
		case "removed":
			removed++
		case "updated":
			updated++
		}
	}

	fmt.Printf("  ➕ Eklenen: %d\n", added)
	fmt.Printf("  ➖ Silinen: %d\n", removed)
	fmt.Printf("  ✎ Güncellenen: %d\n", updated)
}

func scrapeMangaItems() ([]Manga, error) {
	// Chromedp context oluştur
	ctx, cancel := chromedp.NewContext(context.Background())
	defer cancel()

	// Timeout ayarla
	ctx, cancel = context.WithTimeout(ctx, 30*time.Second) // Timeout'u 30sn'ye çıkardım
	defer cancel()

	var htmlContent string

	// Sayfayı yükle ve render et
	err := chromedp.Run(ctx,
		chromedp.Navigate("https://www.mangaread.org/"),
		chromedp.WaitVisible("div.page-item-detail", chromedp.ByQuery),
		chromedp.OuterHTML("html", &htmlContent),
	)
	if err != nil {
		return nil, fmt.Errorf("chromedp hatası: %w", err)
	}

	// HTML'i parse et
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(htmlContent))
	if err != nil {
		return nil, err
	}

	var mangas []Manga

	// Her manga item'ı bul
	doc.Find("div.page-item-detail").Each(func(i int, s *goquery.Selection) {
		manga := Manga{}

		// Resim
		if src, ok := s.Find("img").Attr("src"); ok {
			manga.CoverImage = src
		} else if src, ok := s.Find("img").Attr("data-src"); ok { // Lazy load için kontrol
			manga.CoverImage = src
		}

		// Link ve başlık
		titleLink := s.Find("h3 a").First()
		if titleLink.Length() == 0 {
			titleLink = s.Find("div.post-title h3 a").First()
		}

		if href, ok := titleLink.Attr("href"); ok {
			if href != "" && href != "#" {
				manga.Link = href
			}
		}
		manga.Title = strings.TrimSpace(titleLink.Text())

		// Yayınlanma zamanı
		spanElements := s.Find("span.post-on")
		if spanElements.Length() > 0 {
			manga.PublishedAt = strings.TrimSpace(spanElements.First().Text())
		}

		// Bölüm bilgisi
		chapterLink := s.Find("span.chapter a").First()
		if href, ok := chapterLink.Attr("href"); ok {
			if href != "" {
				manga.ChapterLink = href
			}
		}
		manga.Chapter = strings.TrimSpace(chapterLink.Text())

		// Sadece başlığı ve linki olan öğeleri ekle
		if manga.Title != "" && manga.Link != "" {
			manga.CreatedAt = time.Now()
			manga.UpdatedAt = time.Now()
			mangas = append(mangas, manga)
		}
	})

	return mangas, nil
}
