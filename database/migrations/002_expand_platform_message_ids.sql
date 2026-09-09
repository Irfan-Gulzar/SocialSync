-- Meta message IDs are opaque and can exceed the original VARCHAR(150) limit.
-- ALTER TYPE preserves all existing rows and constraints.
BEGIN;

ALTER TABLE messages
    ALTER COLUMN platform_message_id TYPE TEXT,
    ALTER COLUMN reply_to_platform_message_id TYPE TEXT;

COMMIT;
