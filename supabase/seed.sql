-- Seed data for Supabase
-- This script populates the database with initial data

-- Insert default organization
INSERT INTO organizations (id, name, slug, email, phone, address, logo_url, primary_color, secondary_color, timezone, currency, settings) VALUES
(uuid_generate_v4(), 'Demo Organization', 'demo-org', 'info@demo.org', '+1234567890', '123 Main St, City, State 12345', NULL, '#1976d2', '#dc004e', 'UTC', 'USD', '{"features": {"payments": true, "events": true, "forum": true, "booking": true, "2fa": true}}');

-- Insert sample membership types
INSERT INTO membership_types (id, organization_id, name, slug, description, price, duration_months, max_members, requires_approval, is_active, settings) VALUES
(uuid_generate_v4(), (SELECT id FROM organizations LIMIT 1), 'Basic Membership', 'basic', 'Basic membership with essential features', 50.00, 12, 1, false, true, '{"features": ["basic_access"]}'),
(uuid_generate_v4(), (SELECT id FROM organizations LIMIT 1), 'Premium Membership', 'premium', 'Premium membership with all features', 150.00, 12, 1, true, true, '{"features": ["premium_access", "priority_support"]}'),
(uuid_generate_v4(), (SELECT id FROM organizations LIMIT 1), 'Family Membership', 'family', 'Family membership for up to 4 members', 200.00, 12, 4, true, true, '{"features": ["family_access", "priority_support"]}');

-- Insert sample committees
INSERT INTO committees (id, organization_id, name, description, email, is_active, settings) VALUES
(uuid_generate_v4(), (SELECT id FROM organizations LIMIT 1), 'Board of Directors', 'Main governing body of the organization', 'board@demo.org', true, '{"permissions": ["full_access"]}'),
(uuid_generate_v4(), (SELECT id FROM organizations LIMIT 1), 'Events Committee', 'Organizes and manages events', 'events@demo.org', true, '{"permissions": ["event_management"]}'),
(uuid_generate_v4(), (SELECT id FROM organizations LIMIT 1), 'Membership Committee', 'Handles membership applications and renewals', 'membership@demo.org', true, '{"permissions": ["membership_management"]}');

-- Insert sample events
INSERT INTO events (id, organization_id, title, description, location, start_date, end_date, max_attendees, registration_deadline, price, is_public, status) VALUES
(uuid_generate_v4(), (SELECT id FROM organizations LIMIT 1), 'Annual General Meeting', 'Annual meeting for all members', 'Main Hall, 123 Main St', CURRENT_TIMESTAMP + INTERVAL '30 days', CURRENT_TIMESTAMP + INTERVAL '30 days 2 hours', 100, CURRENT_TIMESTAMP + INTERVAL '25 days', 0.00, true, 'upcoming'),
(uuid_generate_v4(), (SELECT id FROM organizations LIMIT 1), 'Networking Workshop', 'Professional networking and skill development', 'Conference Room A', CURRENT_TIMESTAMP + INTERVAL '45 days', CURRENT_TIMESTAMP + INTERVAL '45 days 3 hours', 50, CURRENT_TIMESTAMP + INTERVAL '40 days', 25.00, true, 'upcoming'),
(uuid_generate_v4(), (SELECT id FROM organizations LIMIT 1), 'Board Meeting', 'Monthly board meeting', 'Board Room', CURRENT_TIMESTAMP + INTERVAL '15 days', CURRENT_TIMESTAMP + INTERVAL '15 days 1 hour', 12, CURRENT_TIMESTAMP + INTERVAL '14 days', 0.00, false, 'upcoming');

-- Insert sample forum categories
INSERT INTO forum_categories (id, organization_id, name, description, display_order, is_active) VALUES
(uuid_generate_v4(), (SELECT id FROM organizations LIMIT 1), 'General Discussion', 'General topics and discussions', 1, true),
(uuid_generate_v4(), (SELECT id FROM organizations LIMIT 1), 'Events', 'Discussion about events and activities', 2, true),
(uuid_generate_v4(), (SELECT id FROM organizations LIMIT 1), 'Membership', 'Questions and discussions about membership', 3, true),
(uuid_generate_v4(), (SELECT id FROM organizations LIMIT 1), 'Technical Support', 'Technical help and support', 4, true);

-- Insert sample documents
INSERT INTO documents (id, organization_id, title, description, file_name, file_path, file_size, mime_type, category, visibility, download_count) VALUES
(uuid_generate_v4(), (SELECT id FROM organizations LIMIT 1), 'Membership Handbook', 'Complete guide to membership benefits and responsibilities', 'membership-handbook.pdf', '/documents/membership-handbook.pdf', 2048000, 'application/pdf', 'handbook', 'public', 45),
(uuid_generate_v4(), (SELECT id FROM organizations LIMIT 1), 'Event Planning Guide', 'How to plan and organize successful events', 'event-planning-guide.pdf', '/documents/event-planning-guide.pdf', 1536000, 'application/pdf', 'guide', 'member', 23),
(uuid_generate_v4(), (SELECT id FROM organizations LIMIT 1), 'Organization Bylaws', 'Official bylaws and governance documents', 'bylaws.pdf', '/documents/bylaws.pdf', 1024000, 'application/pdf', 'governance', 'public', 67);

-- Insert sample surveys
INSERT INTO surveys (id, organization_id, title, description, questions, is_active, start_date, end_date) VALUES
(uuid_generate_v4(), (SELECT id FROM organizations LIMIT 1), 'Member Satisfaction Survey', 'Help us improve our services', '[
  {
    "id": "q1",
    "type": "rating",
    "question": "How satisfied are you with our services?",
    "required": true,
    "options": ["1", "2", "3", "4", "5"]
  },
  {
    "id": "q2",
    "type": "text",
    "question": "What can we improve?",
    "required": false
  }
]', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days'),
(uuid_generate_v4(), (SELECT id FROM organizations LIMIT 1), 'Event Feedback', 'Share your feedback about recent events', '[
  {
    "id": "q1",
    "type": "rating",
    "question": "How would you rate the recent event?",
    "required": true,
    "options": ["1", "2", "3", "4", "5"]
  },
  {
    "id": "q2",
    "type": "multiple_choice",
    "question": "Which events would you like to see more of?",
    "required": false,
    "options": ["Networking", "Workshops", "Social Events", "Educational"]
  }
]', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '14 days');

-- Insert sample email campaigns
INSERT INTO email_campaigns (id, organization_id, name, subject, body_html, body_text, status, recipient_count) VALUES
(uuid_generate_v4(), (SELECT id FROM organizations LIMIT 1), 'Welcome New Members', 'Welcome to our organization!', '<h1>Welcome!</h1><p>We are excited to have you as a member.</p>', 'Welcome! We are excited to have you as a member.', 'sent', 25),
(uuid_generate_v4(), (SELECT id FROM organizations LIMIT 1), 'Monthly Newsletter', 'Monthly updates and news', '<h1>Monthly Newsletter</h1><p>Here are this month''s updates...</p>', 'Monthly Newsletter - Here are this month''s updates...', 'draft', 0);

-- Insert sample notifications
INSERT INTO notifications (id, organization_id, user_id, title, message, type, link, is_read) VALUES
(uuid_generate_v4(), (SELECT id FROM organizations LIMIT 1), (SELECT id FROM users LIMIT 1), 'Welcome to the organization!', 'Your membership has been approved. Welcome aboard!', 'info', '/dashboard', false),
(uuid_generate_v4(), (SELECT id FROM organizations LIMIT 1), (SELECT id FROM users LIMIT 1), 'New event announced', 'Check out our upcoming networking workshop', 'event', '/events', false),
(uuid_generate_v4(), (SELECT id FROM organizations LIMIT 1), (SELECT id FROM users LIMIT 1), 'Document updated', 'The membership handbook has been updated', 'document', '/documents', true);

-- Insert sample audit log entries
INSERT INTO audit_log (id, organization_id, user_id, action, entity_type, entity_id, changes, ip_address) VALUES
(uuid_generate_v4(), (SELECT id FROM organizations LIMIT 1), (SELECT id FROM users LIMIT 1), 'user.created', 'user', (SELECT id FROM users LIMIT 1), '{"email": "admin@demo.org", "role": "admin"}', '192.168.1.1'),
(uuid_generate_v4(), (SELECT id FROM organizations LIMIT 1), (SELECT id FROM users LIMIT 1), 'membership.approved', 'membership', (SELECT id FROM memberships LIMIT 1), '{"status": "approved"}', '192.168.1.1'),
(uuid_generate_v4(), (SELECT id FROM organizations LIMIT 1), (SELECT id FROM users LIMIT 1), 'event.created', 'event', (SELECT id FROM events LIMIT 1), '{"title": "Annual General Meeting"}', '192.168.1.1');