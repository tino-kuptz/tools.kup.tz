CREATE TABLE IF NOT EXISTS tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tracking_ip TEXT NOT NULL,
    tracking_date TEXT NOT NULL,
    token_count INTEGER NOT NULL,
    reason_cat TEXT NOT NULL,
    reason_param TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tracking_ip ON tokens (tracking_ip, tracking_date);
CREATE INDEX IF NOT EXISTS idx_tracking_ip_reason ON tokens (tracking_ip, tracking_date, reason_cat);
-- D1 Database Schema for Request Logs
CREATE TABLE IF NOT EXISTS http_request_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    host TEXT NOT NULL,
    headers TEXT NOT NULL,
    body TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    ip TEXT NOT NULL,
    method TEXT NOT NULL,
    url TEXT NOT NULL,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_host ON http_request_logs(host);
CREATE INDEX IF NOT EXISTS idx_timestamp ON http_request_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_ip ON http_request_logs(ip);
CREATE INDEX IF NOT EXISTS idx_method ON http_request_logs(method);
