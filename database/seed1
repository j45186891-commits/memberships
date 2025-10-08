-- Seed data for Membership Management System - Final corrected version


-- Insert default email templates
INSERT INTO email_templates (organization_id, name, slug, subject, body_html, body_text, template_type, is_active) VALUES
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Welcome Email', 'welcome-email', 'Welcome to Development Organization', '<p>Dear {{first_name}},</p><p>Welcome to Development Organization! Your membership application has been received and is under review.</p><p>Best regards,<br>Development Organization Team</p>', 'Dear {{first_name}},\
\
Welcome to Development Organization! Your membership application has been received and is under review.\
\
Best regards,\
Development Organization Team', 'welcome', true),
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Membership Approved', 'membership-approved', 'Your membership has been approved!', '<p>Dear {{first_name}},</p><p>Great news! Your membership has been approved. You can now access all member benefits.</p><p>Best regards,<br>Development Organization Team</p>', 'Dear {{first_name}},\
\
Great news! Your membership has been approved. You can now access all member benefits.\
\
Best regards,\
Development Organization Team', 'approval', true),
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Membership Renewal Reminder', 'renewal-reminder', 'Membership Renewal Reminder', '<p>Dear {{first_name}},</p><p>Your membership will expire on {{expiry_date}}. Please renew to continue enjoying member benefits.</p><p>Best regards,<br>Development Organization Team</p>', 'Dear {{first_name}},\
\
Your membership will expire on {{expiry_date}}. Please renew to continue enjoying member benefits.\
\
Best regards,\
Development Organization Team', 'renewal', true),
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Event Invitation', 'event-invitation', 'You''re invited: {{event_name}}', '<p>Dear {{first_name}},</p><p>You''re invited to {{event_name}} on {{event_date}} at {{event_location}}.</p><p>Description: {{event_description}}</p><p>Register now to secure your spot!</p><p>Best regards,<br>Development Organization Team</p>', 'Dear {{first_name}},\
\
You''re invited to {{event_name}} on {{event_date}} at {{event_location}}.\
\
Description: {{event_description}}\
\
Register now to secure your spot!\
\
Best regards,\
Development Organization Team', 'event', true),
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Password Reset', 'password-reset', 'Password Reset Request', '<p>Dear {{first_name}},</p><p>You requested a password reset. Click the link below to reset your password:</p><p><a href="{{reset_link}}">{{reset_link}}</a></p><p>This link will expire in 1 hour.</p><p>If you didn''t request this, please ignore this email.</p><p>Best regards,<br>Development Organization Team</p>', 'Dear {{first_name}},\
\
You requested a password reset. Click the link below to reset your password:\
{{reset_link}}\
\
This link will expire in 1 hour.\
\
If you didn''t request this, please ignore this email.\
\
Best regards,\
Development Organization Team', 'password_reset', true);


-- Insert default committees
INSERT INTO committees (organization_id, name, description, email, is_active) VALUES
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Executive Committee', 'Primary decision-making committee for the organization', 'exec@dev-org.org', true),
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Membership Committee', 'Handles membership applications and renewals', 'membership@dev-org.org', true),
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Events Committee', 'Plans and organizes events and activities', 'events@dev-org.org', true),
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Communications Committee', 'Manages internal and external communications', 'communications@dev-org.org', true);


-- Insert default committee positions
INSERT INTO committee_positions (committee_id, title, description, can_send_emails, permissions, display_order) VALUES
((SELECT id FROM committees WHERE name='Executive Committee' LIMIT 1), 'President', 'Overall leadership and strategic direction', true, '["manage_organization", "manage_memberships", "manage_committees", "manage_events", "manage_finances"]'::jsonb, 1),
((SELECT id FROM committees WHERE name='Executive Committee' LIMIT 1), 'Vice President', 'Assists president and fills in when absent', true, '["manage_memberships", "manage_events"]'::jsonb, 2),
((SELECT id FROM committees WHERE name='Executive Committee' LIMIT 1), 'Secretary', 'Maintains records and meeting minutes', true, '["manage_documents", "manage_communications"]'::jsonb, 3),
((SELECT id FROM committees WHERE name='Executive Committee' LIMIT 1), 'Treasurer', 'Manages finances and budgeting', true, '["manage_finances", "view_analytics"]'::jsonb, 4),
((SELECT id FROM committees WHERE name='Membership Committee' LIMIT 1), 'Chair', 'Leads membership activities', true, '["manage_memberships", "approve_memberships"]'::jsonb, 1),
((SELECT id FROM committees WHERE name='Membership Committee' LIMIT 1), 'Vice Chair', 'Supports chair activities', true, '["manage_memberships"]'::jsonb, 2);


-- Insert default resources
INSERT INTO resources (organization_id, name, description, resource_type, capacity, is_active) VALUES
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Main Meeting Room', 'Large meeting room suitable for up to 50 people', 'meeting_room', 50, true),
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Training Room', 'Medium room with projector for training sessions', 'training_room', 25, true),
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Equipment Storage', 'Storage area for equipment and supplies', 'storage', 0, true);


-- Insert default forum categories
INSERT INTO forum_categories (organization_id, name, description, color, is_active, order_index) VALUES
('50d40a41-26a5-4a69-be77-c00c84367e50', 'General Discussion', 'General topics and announcements', '#1976d2', true, 1),
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Events & Activities', 'Discussion about upcoming events and activities', '#388e3c', true, 2),
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Member Resources', 'Share resources, tips, and information', '#ff9800', true, 3),
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Technical Support', 'Get help with technical issues', '#f44336', true, 4);


-- Insert default mailing lists
INSERT INTO mailing_lists (organization_id, name, description, is_active, auto_subscribe_new_members) VALUES
('50d40a41-26a5-4a69-be77-c00c84367e50', 'All Members', 'All current members', true, true),
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Committee Members', 'All committee members', true, false),
('50d40a41-26a5-4a69-be77-c00c84367e50', 'New Members', 'Recently joined members', true, false);


-- Insert default workflows
INSERT INTO workflows (organization_id, name, description, trigger_type, trigger_config, actions, is_active) VALUES
('50d40a41-26a5-4a69-be77-c00c84367e50', 'New Member Welcome', 'Automatically welcome new members', 'membership_approved', '{}'::jsonb, '["send_welcome_email", "add_to_mailing_list"]'::jsonb, true),
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Membership Expiry Reminder', 'Send reminder before membership expires', 'membership_expiring', '{"days_before": 30}'::jsonb, '["send_renewal_email"]'::jsonb, true);


-- Insert default surveys
INSERT INTO surveys (organization_id, title, description, type, questions, is_active) VALUES
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Member Satisfaction Survey', 'Help us improve our services', 'feedback', '[
  {"id": "q1", "type": "rating", "question": "How satisfied are you with our services?", "required": true},
  {"id": "q2", "type": "text", "question": "What improvements would you like to see?", "required": false}
]'::jsonb, true);


-- Insert default events
INSERT INTO events (organization_id, title, description, event_date, location, max_attendees, price, registration_deadline, is_active) VALUES
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Annual General Meeting', 'Our yearly general meeting for all members', '2025-12-15 14:00:00', 'Main Meeting Room', 50, 0.00, '2025-12-10 23:59:59', true),
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Welcome New Members', 'Meet and greet for new members', '2025-11-20 19:00:00', 'Training Room', 25, 0.00, '2025-11-19 23:59:59', true);


-- Insert default documents
INSERT INTO documents (organization_id, title, description, file_name, file_path, file_size, mime_type, category, uploaded_by, is_public, is_active) VALUES
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Member Handbook', 'Complete guide for new members', 'member-handbook.pdf', '/uploads/member-handbook.pdf', 2500000, 'application/pdf', 'handbook', '57970162-4d6b-4896-99a0-974d395b5454', true, true),
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Code of Conduct', 'Member code of conduct and guidelines', 'code-of-conduct.pdf', '/uploads/code-of-conduct.pdf', 500000, 'application/pdf', 'policy', '57970162-4d6b-4896-99a0-974d395b5454', true, true);


-- Insert sample memberships
INSERT INTO memberships (organization_id, user_id, membership_type_id, status, start_date, end_date, approved_by, price_paid) VALUES
('50d40a41-26a5-4a69-be77-c00c84367e50', '57970162-4d6b-4896-99a0-974d395b5454', (SELECT id FROM membership_types WHERE slug='adult'), 'active', '2025-01-01', '2025-12-31', '57970162-4d6b-4896-99a0-974d395b5454', 50.00);


-- Assign admin to committee position
INSERT INTO committee_members (committee_id, user_id, position_id, is_active) VALUES
((SELECT id FROM committees WHERE name='Executive Committee' LIMIT 1), '57970162-4d6b-4896-99a0-974d395b5454', (SELECT id FROM committee_positions WHERE title='President' LIMIT 1), true);
