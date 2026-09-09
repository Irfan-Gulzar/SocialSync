-- SocialSync Pro - fictional demonstration data
-- WARNING: clears inbox data. Run only against a disposable demo database.
-- WhatsApp and TikTok rows demonstrate the UI; their integrations are not implemented.

BEGIN;

-- Clear existing data (order matters due to FK constraints)
TRUNCATE messages, conversations, customers RESTART IDENTITY CASCADE;

-- ═══════════════════════════════════════════════════════
-- Customers  (10 customers across 4 platforms)
-- ═══════════════════════════════════════════════════════
INSERT INTO customers (platform, platform_customer_id, name, created_at) VALUES
  ('whatsapp',  '+923001234567',  'Zara Khan',       NOW() - INTERVAL '14 days'),
  ('whatsapp',  '+923219876543',  'Hamza Malik',     NOW() - INTERVAL '10 days'),
  ('instagram', 'ig_sarah_ahmed', 'Sarah Ahmed',     NOW() - INTERVAL '12 days'),
  ('instagram', 'ig_maya_ali',    'Maya Ali',        NOW() - INTERVAL '8 days'),
  ('facebook',  'psid_ali_raza',  'Ali Raza',        NOW() - INTERVAL '11 days'),
  ('facebook',  'psid_noor_fatima','Noor Fatima',    NOW() - INTERVAL '6 days'),
  ('tiktok',    'tt_bilal_shah',  'Bilal Shah',      NOW() - INTERVAL '9 days'),
  ('tiktok',    'tt_hina_pervez', 'Hina Pervez',     NOW() - INTERVAL '5 days'),
  ('whatsapp',  '+923451112233',  'Omar Farooq',     NOW() - INTERVAL '7 days'),
  ('facebook',  'psid_ayesha_k',  'Ayesha Khalid',  NOW() - INTERVAL '3 days');

-- ═══════════════════════════════════════════════════════
-- Conversations  (10 conversations, 1 per customer)
-- ═══════════════════════════════════════════════════════
INSERT INTO conversations (customer_id, platform, last_message_at, created_at) VALUES
  (1,  'whatsapp',  NOW() - INTERVAL '1 hour',   NOW() - INTERVAL '14 days'),
  (2,  'whatsapp',  NOW() - INTERVAL '3 hours',  NOW() - INTERVAL '10 days'),
  (3,  'instagram', NOW() - INTERVAL '30 minutes',NOW() - INTERVAL '12 days'),
  (4,  'instagram', NOW() - INTERVAL '5 hours',  NOW() - INTERVAL '8 days'),
  (5,  'facebook',  NOW() - INTERVAL '2 hours',  NOW() - INTERVAL '11 days'),
  (6,  'facebook',  NOW() - INTERVAL '6 hours',  NOW() - INTERVAL '6 days'),
  (7,  'tiktok',    NOW() - INTERVAL '4 hours',  NOW() - INTERVAL '9 days'),
  (8,  'tiktok',    NOW() - INTERVAL '8 hours',  NOW() - INTERVAL '5 days'),
  (9,  'whatsapp',  NOW() - INTERVAL '45 minutes',NOW() - INTERVAL '7 days'),
  (10, 'facebook',  NOW() - INTERVAL '15 minutes',NOW() - INTERVAL '3 days');

-- ═══════════════════════════════════════════════════════
-- Messages  (~45 messages spread across conversations & 7 days)
-- ═══════════════════════════════════════════════════════

-- Conversation 1: Zara Khan (WhatsApp) — pricing inquiry
INSERT INTO messages (conversation_id, sender_type, content, created_at) VALUES
  (1, 'customer', 'Hi! I wanted to ask about your premium subscription pricing?', NOW() - INTERVAL '6 days'),
  (1, 'agent',    'Hello Zara! Our premium plan starts at $29/month with all features included.', NOW() - INTERVAL '6 days' + INTERVAL '3 minutes'),
  (1, 'customer', 'Does it include API access?', NOW() - INTERVAL '6 days' + INTERVAL '5 minutes'),
  (1, 'agent',    'Yes! Full REST API access, webhooks, and 10k requests/day are included in the premium tier.', NOW() - INTERVAL '6 days' + INTERVAL '8 minutes'),
  (1, 'customer', 'Great, I will sign up today. Thanks!', NOW() - INTERVAL '1 hour');

-- Conversation 2: Hamza Malik (WhatsApp) — order status
INSERT INTO messages (conversation_id, sender_type, content, created_at) VALUES
  (2, 'customer', 'Assalam o Alaikum! My order #5521 has not arrived yet.', NOW() - INTERVAL '5 days'),
  (2, 'agent',    'Walaikum Assalam Hamza! Let me check the tracking for order #5521.', NOW() - INTERVAL '5 days' + INTERVAL '2 minutes'),
  (2, 'agent',    'Your order is currently in transit and expected to arrive by tomorrow evening.', NOW() - INTERVAL '5 days' + INTERVAL '5 minutes'),
  (2, 'customer', 'JazakAllah, thank you for the quick response!', NOW() - INTERVAL '5 days' + INTERVAL '7 minutes'),
  (2, 'customer', 'Update: I received the order. Everything looks great!', NOW() - INTERVAL '3 hours');

-- Conversation 3: Sarah Ahmed (Instagram) — product inquiry
INSERT INTO messages (conversation_id, sender_type, content, created_at) VALUES
  (3, 'customer', 'Hey! Loved the new collection shown in your latest reel 😍', NOW() - INTERVAL '4 days'),
  (3, 'agent',    'Thank you Sarah! Which pieces caught your eye? We can help you find the perfect size.', NOW() - INTERVAL '4 days' + INTERVAL '4 minutes'),
  (3, 'customer', 'The emerald green kurta set! Is it available in medium?', NOW() - INTERVAL '4 days' + INTERVAL '6 minutes'),
  (3, 'agent',    'Yes! Medium is in stock. Shall I reserve one for you? Its priced at PKR 4,500.', NOW() - INTERVAL '4 days' + INTERVAL '10 minutes'),
  (3, 'customer', 'Yes please! How do I pay?', NOW() - INTERVAL '30 minutes');

-- Conversation 4: Maya Ali (Instagram) — return request
INSERT INTO messages (conversation_id, sender_type, content, created_at) VALUES
  (4, 'customer', 'Hi, I need to return an item. The size didn''t fit properly.', NOW() - INTERVAL '3 days'),
  (4, 'agent',    'Sorry to hear that Maya! Could you share your order number so we can initiate the return?', NOW() - INTERVAL '3 days' + INTERVAL '5 minutes'),
  (4, 'customer', 'Order #7839. I''d like an exchange for a larger size if possible.', NOW() - INTERVAL '3 days' + INTERVAL '8 minutes'),
  (4, 'agent',    'Absolutely! We''ll send a return label to your email. The exchange will be processed within 3-5 business days.', NOW() - INTERVAL '5 hours');

-- Conversation 5: Ali Raza (Facebook) — general support
INSERT INTO messages (conversation_id, sender_type, content, created_at) VALUES
  (5, 'customer', 'Hello! Do you offer cash on delivery in Lahore?', NOW() - INTERVAL '5 days'),
  (5, 'agent',    'Hi Ali! Yes, we offer COD in all major cities including Lahore, Karachi, and Islamabad.', NOW() - INTERVAL '5 days' + INTERVAL '3 minutes'),
  (5, 'customer', 'Perfect! And what are your delivery charges?', NOW() - INTERVAL '5 days' + INTERVAL '5 minutes'),
  (5, 'agent',    'Delivery is free for orders above PKR 3,000. Otherwise, it''s a flat PKR 200.', NOW() - INTERVAL '5 days' + INTERVAL '8 minutes'),
  (5, 'customer', 'Thanks! Placing my order now.', NOW() - INTERVAL '2 hours');

-- Conversation 6: Noor Fatima (Facebook) — complaint
INSERT INTO messages (conversation_id, sender_type, content, created_at) VALUES
  (6, 'customer', 'I received a damaged product. This is unacceptable!', NOW() - INTERVAL '2 days'),
  (6, 'agent',    'We sincerely apologize Noor. Could you send photos of the damage? We''ll arrange an immediate replacement.', NOW() - INTERVAL '2 days' + INTERVAL '2 minutes'),
  (6, 'customer', 'Here are the photos. The packaging was torn and the item has a scratch.', NOW() - INTERVAL '2 days' + INTERVAL '10 minutes'),
  (6, 'agent',    'Thank you for sharing. A replacement has been dispatched and will reach you within 2 days. We''re also adding a 15% discount coupon for the inconvenience.', NOW() - INTERVAL '6 hours');

-- Conversation 7: Bilal Shah (TikTok) — promo code query
INSERT INTO messages (conversation_id, sender_type, content, created_at) VALUES
  (7, 'customer', 'Saw your TikTok ad! Is the promo code SUMMER25 still valid?', NOW() - INTERVAL '3 days'),
  (7, 'agent',    'Hey Bilal! Yes, SUMMER25 gives you 25% off on all items. Valid until end of this month!', NOW() - INTERVAL '3 days' + INTERVAL '4 minutes'),
  (7, 'customer', 'Awesome! Can I stack it with the bundle deal?', NOW() - INTERVAL '3 days' + INTERVAL '6 minutes'),
  (7, 'agent',    'Unfortunately promo codes can''t be combined with existing bundle discounts, but the bundle deal itself is already a better value!', NOW() - INTERVAL '4 hours');

-- Conversation 8: Hina Pervez (TikTok) — collaboration inquiry
INSERT INTO messages (conversation_id, sender_type, content, created_at) VALUES
  (8, 'customer', 'Hi! I''m a content creator with 50k followers. Would you be interested in a collab?', NOW() - INTERVAL '2 days'),
  (8, 'agent',    'Hello Hina! We''d love to explore collaboration opportunities. Could you share your TikTok handle and content niche?', NOW() - INTERVAL '2 days' + INTERVAL '6 minutes'),
  (8, 'customer', '@hinapervez_style — I focus on affordable Pakistani fashion hauls and styling tips.', NOW() - INTERVAL '2 days' + INTERVAL '10 minutes'),
  (8, 'agent',    'That sounds like a great fit! Our marketing team will reach out via email within 24 hours with a proposal.', NOW() - INTERVAL '8 hours');

-- Conversation 9: Omar Farooq (WhatsApp) — bulk order
INSERT INTO messages (conversation_id, sender_type, content, created_at) VALUES
  (9, 'customer', 'I need to place a bulk order of 50 units. Do you offer wholesale pricing?', NOW() - INTERVAL '1 day'),
  (9, 'agent',    'Absolutely Omar! For orders of 50+ units, we offer a 30% wholesale discount. Let me prepare a quote.', NOW() - INTERVAL '1 day' + INTERVAL '5 minutes'),
  (9, 'customer', 'That sounds great. Please send the quote for the Classic White collection.', NOW() - INTERVAL '1 day' + INTERVAL '8 minutes'),
  (9, 'agent',    'Quote sent to your WhatsApp! Total comes to PKR 175,000 with free shipping. Valid for 7 days.', NOW() - INTERVAL '45 minutes');

-- Conversation 10: Ayesha Khalid (Facebook) — feature request
INSERT INTO messages (conversation_id, sender_type, content, created_at) VALUES
  (10, 'customer', 'Love your products! Any plans to launch a mobile app?', NOW() - INTERVAL '1 day'),
  (10, 'agent',    'Thank you Ayesha! Yes, our mobile app is currently in development and expected to launch in Q1 2027.', NOW() - INTERVAL '1 day' + INTERVAL '3 minutes'),
  (10, 'customer', 'That''s exciting! Will it have a loyalty program?', NOW() - INTERVAL '1 day' + INTERVAL '5 minutes'),
  (10, 'agent',    'Absolutely! The app will feature a points-based loyalty program, exclusive deals, and order tracking.', NOW() - INTERVAL '15 minutes'),
  (10, 'customer', 'Can''t wait! I''ll definitely download it.', NOW() - INTERVAL '15 minutes' + INTERVAL '2 minutes');

COMMIT;
