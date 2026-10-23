-- PawnZM database schema
-- Import with:  mysql -u root -p < schema.sql
-- or paste into phpMyAdmin's SQL tab.

CREATE DATABASE IF NOT EXISTS pawnzm_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE pawnzm_db;

CREATE TABLE IF NOT EXISTS products (
    id          INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(100)  NOT NULL,
    price       DECIMAL(12,2) NOT NULL,
    category    VARCHAR(30)   NOT NULL,
    seller      VARCHAR(60)   NOT NULL,
    location    VARCHAR(80)   NOT NULL,
    contact     VARCHAR(255)  NOT NULL,
    description TEXT,
    image       VARCHAR(255)  NOT NULL,
    created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category)
);
