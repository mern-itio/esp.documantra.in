-- Visitor Tracking Database (separate from master MongoDB)
-- Retention: records older than TRACKING_RETENTION_DAYS are deleted daily.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS tracking_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO tracking_settings (key, value)
VALUES ('retention_days', '90')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS visitor_profiles (
  visitor_id UUID PRIMARY KEY,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_landing_url TEXT,
  first_referrer TEXT,
  first_referring_domain TEXT,
  first_source TEXT,
  latest_source TEXT,
  latest_referrer TEXT,
  latest_landing_url TEXT,
  browser_name TEXT,
  browser_version TEXT,
  os_name TEXT,
  device_type TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visitor_profiles_last_seen ON visitor_profiles (last_seen_at);

CREATE TABLE IF NOT EXISTS visitor_attribution (
  visitor_id UUID PRIMARY KEY REFERENCES visitor_profiles(visitor_id) ON DELETE CASCADE,
  first_touch_source TEXT,
  first_touch_referrer TEXT,
  first_touch_landing_url TEXT,
  first_touch_campaign TEXT,
  first_touch_medium TEXT,
  first_touch_term TEXT,
  first_touch_content TEXT,
  first_touch_gclid TEXT,
  first_touch_fbclid TEXT,
  first_touch_at TIMESTAMPTZ,
  latest_touch_source TEXT,
  latest_touch_referrer TEXT,
  latest_touch_campaign TEXT,
  latest_touch_medium TEXT,
  latest_touch_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visitor_sessions (
  session_id UUID PRIMARY KEY,
  visitor_id UUID NOT NULL REFERENCES visitor_profiles(visitor_id) ON DELETE CASCADE,
  session_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_end TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  landing_page TEXT,
  referrer TEXT,
  traffic_source TEXT,
  entry_title TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_visitor_sessions_visitor ON visitor_sessions (visitor_id, session_start DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_activity ON visitor_sessions (last_activity_at);

CREATE TABLE IF NOT EXISTS visitor_page_views (
  page_view_id BIGSERIAL PRIMARY KEY,
  visitor_id UUID NOT NULL REFERENCES visitor_profiles(visitor_id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES visitor_sessions(session_id) ON DELETE CASCADE,
  page_url TEXT NOT NULL,
  page_path TEXT,
  page_title TEXT,
  previous_page TEXT,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_seconds INTEGER,
  sequence_no INTEGER
);

CREATE INDEX IF NOT EXISTS idx_page_views_visitor ON visitor_page_views (visitor_id, entered_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON visitor_page_views (session_id, entered_at);
CREATE INDEX IF NOT EXISTS idx_page_views_entered ON visitor_page_views (entered_at);

CREATE TABLE IF NOT EXISTS visitor_events (
  event_id BIGSERIAL PRIMARY KEY,
  visitor_id UUID NOT NULL REFERENCES visitor_profiles(visitor_id) ON DELETE CASCADE,
  session_id UUID REFERENCES visitor_sessions(session_id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  page_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_visitor ON visitor_events (visitor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_created ON visitor_events (created_at);
CREATE INDEX IF NOT EXISTS idx_events_type ON visitor_events (event_type);

CREATE TABLE IF NOT EXISTS visitor_ip_observations (
  observation_id BIGSERIAL PRIMARY KEY,
  visitor_id UUID NOT NULL REFERENCES visitor_profiles(visitor_id) ON DELETE CASCADE,
  session_id UUID REFERENCES visitor_sessions(session_id) ON DELETE SET NULL,
  ip_address TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  isp TEXT,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ip_obs_visitor ON visitor_ip_observations (visitor_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_ip_obs_observed ON visitor_ip_observations (observed_at);

CREATE TABLE IF NOT EXISTS customer_visitor_mapping (
  customer_id TEXT NOT NULL,
  visitor_id UUID NOT NULL REFERENCES visitor_profiles(visitor_id) ON DELETE CASCADE,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  link_source TEXT DEFAULT 'signup',
  PRIMARY KEY (customer_id, visitor_id)
);

CREATE INDEX IF NOT EXISTS idx_cvm_visitor ON customer_visitor_mapping (visitor_id);
CREATE INDEX IF NOT EXISTS idx_cvm_customer ON customer_visitor_mapping (customer_id);

CREATE TABLE IF NOT EXISTS retention_cleanup_logs (
  log_id BIGSERIAL PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  retention_days INTEGER NOT NULL,
  deleted_page_views BIGINT DEFAULT 0,
  deleted_events BIGINT DEFAULT 0,
  deleted_sessions BIGINT DEFAULT 0,
  deleted_ip_observations BIGINT DEFAULT 0,
  deleted_profiles BIGINT DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
