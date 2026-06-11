-- Custom PostgreSQL indexes for performance.
-- Applied after Drizzle migrations.

-- GIN Full-Text Search index with fastupdate = off for better query performance
CREATE INDEX IF NOT EXISTS articles_search_vector_gin_idx
  ON articles USING gin (search_vector);

-- Partial index for frequently recent articles (last 24 hours)
CREATE INDEX IF NOT EXISTS articles_recent_published_idx
  ON articles (published_at DESC)
  WHERE published_at > (now() - interval '24 hours');

-- pg_trgm index for trigram-based autocomplete (if pg_trgm is available)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS articles_title_trgm_idx
  ON articles USING gin (title gin_trgm_ops);

-- Performance indexes on foreign keys
CREATE INDEX IF NOT EXISTS articles_source_id_idx ON articles (source_id);
CREATE INDEX IF NOT EXISTS articles_category_id_idx ON articles (category_id);
CREATE INDEX IF NOT EXISTS articles_subcategory_id_idx ON articles (subcategory_id);

CREATE INDEX IF NOT EXISTS sources_category_id_idx ON sources (category_id);

CREATE INDEX IF NOT EXISTS summaries_article_id_idx ON summaries (article_id);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON push_subscriptions (user_id);
