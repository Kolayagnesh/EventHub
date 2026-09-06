-- =================================================================
-- 3. EVENT SERVICE DATABASE & TABLES (Updated Hierarchical Schema)
-- =================================================================
CREATE DATABASE IF NOT EXISTS event_db;
USE event_db;

-- 1. Physical Venue Template
CREATE TABLE IF NOT EXISTS venues (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    total_capacity INT NOT NULL
);

-- 2. Physical Layout Blueprint (No pricing here - purely spatial geometry)
CREATE TABLE IF NOT EXISTS venue_sections (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    venue_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,        -- e.g., 'VIP Lounge', 'North Stand'
    total_rows INT NOT NULL,           -- e.g., 10 rows (A-J)
    seats_per_row INT NOT NULL,        -- e.g., 20 seats per row
    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
);

-- 3. Scheduled Event Snapshot
CREATE TABLE IF NOT EXISTS events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    venue_id BIGINT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venue_id) REFERENCES venues(id)
);

-- 4. Event-Specific Bookable Seats (Generated snapshot with event price)
CREATE TABLE IF NOT EXISTS event_seats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_id BIGINT NOT NULL,
    venue_section_id BIGINT NOT NULL,
    row_label VARCHAR(10) NOT NULL,    -- 'A', 'B', 'C'
    seat_number INT NOT NULL,          -- 1, 2, 3 ...
    full_seat_code VARCHAR(50) NOT NULL, -- e.g., 'VIP-A1'
    price DECIMAL(10, 2) NOT NULL,     -- Specific price for this event
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, LOCKED, BOOKED
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (venue_section_id) REFERENCES venue_sections(id),
    INDEX idx_event_seat_status (event_id, status)
);