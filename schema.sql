-- schema.sql
CREATE TABLE crawled_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  content TEXT NOT NULL,
  crawled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_url ON crawled_results(url);
CREATE INDEX idx_expires_at ON crawled_results(expires_at);