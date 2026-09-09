-- Adds webhook persistence support without deleting or replacing existing rows.
BEGIN;

ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS deduplication_key TEXT,
    ADD COLUMN IF NOT EXISTS message_type VARCHAR(30) NOT NULL DEFAULT 'text',
    ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS reply_to_platform_message_id VARCHAR(150);

CREATE UNIQUE INDEX IF NOT EXISTS conversations_customer_platform_unique
    ON conversations (customer_id, platform);

CREATE UNIQUE INDEX IF NOT EXISTS messages_deduplication_key_unique
    ON messages (deduplication_key)
    WHERE deduplication_key IS NOT NULL;

COMMIT;
