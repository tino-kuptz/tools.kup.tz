CREATE TABLE tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tracking_ip TEXT NOT NULL,
    tracking_date TEXT NOT NULL,
    token_count INTEGER NOT NULL,
    reason_cat TEXT NOT NULL,
    reason_param TEXT NOT NULL
);
CREATE INDEX idx_tracking_ip ON tokens (tracking_ip, tracking_date);
