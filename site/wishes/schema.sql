CREATE TABLE IF NOT EXISTS wishes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  author VARCHAR(40) NOT NULL DEFAULT '',
  message VARCHAR(220) NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  image_path VARCHAR(255) NULL DEFAULT NULL,
  image_mime VARCHAR(32) NULL DEFAULT NULL,
  image_width INT UNSIGNED NULL DEFAULT NULL,
  image_height INT UNSIGNED NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY wishes_status_created_idx (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
