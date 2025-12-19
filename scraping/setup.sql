-- Supabase SQL Editor'da çalıştır

CREATE TABLE IF NOT EXISTS mangas (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  chapter VARCHAR(255),
  cover_image TEXT,
  published_at VARCHAR(255),
  link VARCHAR(500) UNIQUE NOT NULL,
  chapter_link TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_link UNIQUE (link)
);

-- İndeks oluştur (hızlı sorgu için)
CREATE INDEX IF NOT EXISTS idx_mangas_link ON mangas(link);
CREATE INDEX IF NOT EXISTS idx_mangas_updated_at ON mangas(updated_at);

-- Tümü SELECT
SELECT * FROM mangas;

-- Yeni manga ekle
INSERT INTO mangas (title, chapter, cover_image, published_at, link, chapter_link)
VALUES ('Test Manga', 'Chapter 1', 'https://example.com/img.jpg', '2025-12-19', 'https://example.com/manga', 'https://example.com/chapter1');

-- Güncelle
UPDATE mangas SET chapter = 'Chapter 2' WHERE link = 'https://example.com/manga';

-- Sil
DELETE FROM mangas WHERE link = 'https://example.com/manga';
