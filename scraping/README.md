# Manga Scraper - Supabase Entegrasyon

Bu Go uygulaması https://www.mangaread.org/ sitesini scrape eder ve Supabase veritabanında saklanan verilerle karşılaştırır.

## Özellikler

- ✅ JavaScript render desteği (Chromedp ile)
- ✅ Her 30 dakikada otomatik scraping
- ✅ Supabase entegrasyon
- ✅ Otomatik veri karşılaştırma
- ✅ Değişiklik loglama (eklenen, silinen, güncellenen)
- ✅ Yalnızca değişen veriler DB'ye yazılır

## Kurulum

### 1. Gerekli Kütüphaneleri Yükle

```bash
cd scraping
go mod download
```

### 2. Supabase Kurulum

1. [Supabase](https://supabase.com) hesabı oluştur
2. Yeni proje oluştur
3. Supabase SQL Editor'da `setup.sql` dosyasının içeriğini çalıştır
4. Proje ayarlarından API anahtarlarını al

### 3. Environment Variables Ayarla

`.env` dosyası oluştur:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

Değerleri Supabase'den al:
- Settings → API → Project URL (SUPABASE_URL)
- Settings → API → anon public (SUPABASE_ANON_KEY)

### 4. Chrome/Chromium Yüklü Olması Gerekir

Windows'ta Chrome veya Chromium kurulu olması gerekiyor.

## Kullanım

```bash
go run main.go
```

Çıktı örneği:

```
Supabase'e bağlandı

=== İlk Scraping Başlıyor ===

📥 Veriler scrape ediliyor...
✓ 30 manga bulundu

📂 Veritabanındaki veriler yükleniyor...
✓ 0 manga veritabanında bulundu

🔄 Veriler karşılaştırılıyor...
  ➕ Eklendi: Manga 1
  ➕ Eklendi: Manga 2
  ...

📋 Değişiklik Özeti:
  ➕ Eklenen: 30
  ➖ Silinen: 0
  ✎ Güncellenen: 0

Scheduler başlatıldı (30 dakikada bir scraping yapılacak)
```

## Veri Yapısı

Supabase'deki `mangas` tablosu:

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | BIGSERIAL | Benzersiz ID |
| title | VARCHAR | Manga başlığı |
| chapter | VARCHAR | En son bölüm |
| cover_image | TEXT | Kapak resmi URL'i |
| published_at | VARCHAR | Yayın tarihi |
| link | VARCHAR | Manga sayfası URL'i (UNIQUE) |
| chapter_link | TEXT | Bölüm sayfası URL'i |
| created_at | TIMESTAMP | Oluşturulma tarihi |
| updated_at | TIMESTAMP | Son güncelleme tarihi |

## Loglama

Değişiklikler console'a yazılır:

- ➕ **Eklendi**: Veritabanında olmayan yeni manga
- ➖ **Silindi**: Scrape edilen veride olmayan eski manga
- ✎ **Güncellendi**: Bölüm, kapak veya diğer bilgiler değişen manga

## Sorular ve Sorunlar

- **Chrome kurulu değil hatası?** Chrome veya Chromium'u yükle
- **Supabase bağlantı hatası?** API anahtarlarını ve URL'i kontrol et
- **Timeout hatası?** İnternet bağlantınızı kontrol et

## Todo

- [ ] Log dosyasına yazma
- [ ] Email notifikasyonu
- [ ] Web dashboard
- [ ] Diğer manga siteleri desteği
