-- SocialSync Pro Database Schema

CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(20) NOT NULL,
    platform_customer_id VARCHAR(100) NOT NULL,  -- customer's PSID / WA number / IG-scoped ID
    name VARCHAR(150),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (platform, platform_customer_id)
);

CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    platform VARCHAR(20) NOT NULL,
    last_message_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX conversations_customer_platform_unique
    ON conversations (customer_id, platform);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id),
    sender_type VARCHAR(10) NOT NULL,     -- 'customer' | 'agent'
    content TEXT NOT NULL,
    platform_message_id TEXT,             -- Opaque ID from FB/IG/WA for de-duplication
    deduplication_key TEXT,
    message_type VARCHAR(30) NOT NULL DEFAULT 'text',
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
    reply_to_platform_message_id TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX messages_deduplication_key_unique
    ON messages (deduplication_key)
    WHERE deduplication_key IS NOT NULL;
