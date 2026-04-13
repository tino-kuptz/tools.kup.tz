-- PostgreSQL schema (replaces former SQLite / D1 definitions)

CREATE TABLE IF NOT EXISTS tokens (
    id BIGSERIAL PRIMARY KEY,
    tracking_ip TEXT NOT NULL,
    tracking_date DATE NOT NULL,
    token_count INTEGER NOT NULL,
    reason_cat TEXT NOT NULL,
    reason_param TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tracking_ip ON tokens (tracking_ip, tracking_date);
CREATE INDEX IF NOT EXISTS idx_tracking_ip_reason ON tokens (tracking_ip, tracking_date, reason_cat);

CREATE TABLE IF NOT EXISTS http_request_logs (
    id BIGSERIAL PRIMARY KEY,
    host TEXT NOT NULL,
    headers TEXT NOT NULL,
    body TEXT NOT NULL,
    logged_at TIMESTAMPTZ NOT NULL,
    ip TEXT NOT NULL,
    method TEXT NOT NULL,
    url TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE INDEX IF NOT EXISTS idx_host ON http_request_logs(host);
CREATE INDEX IF NOT EXISTS idx_logged_at ON http_request_logs(logged_at);
CREATE INDEX IF NOT EXISTS idx_ip ON http_request_logs(ip);
CREATE INDEX IF NOT EXISTS idx_method ON http_request_logs(method);

-- DNS scan + crt.sh JSON cache (replaces KV); TTL enforced via expires_at
CREATE TABLE IF NOT EXISTS dns_scan_cache (
    cache_key TEXT PRIMARY KEY,
    payload JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dns_scan_cache_expires ON dns_scan_cache(expires_at);
