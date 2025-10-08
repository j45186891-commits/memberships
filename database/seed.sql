-- Seed corrected essential data
 
-- Insert default email templates
INSERT INTO email_templates (organization_id, name, slug, subject, body_html, body_text, template_type, is_active) VALUES
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Welcome Email', 'welcome-email', 'Welcome to Development Organization', '<p>Dear {{first_name}},</p><p>Welcome to Development Organization!</p>', 'Dear {{first_name}},\
Welcome to Development Organization!', 'welcome', true),
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Membership Approved', 'membership-approved', 'Your membership has been approved!', '<p>Dear {{first_name}},</p><p>Your membership has been approved!</p>', 'Dear {{first_name}},\
Your membership has been approved!', 'approval', true);
 
-- Insert default committees
INSERT INTO committees (organization_id, name, description, email, is_active) VALUES
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Executive Committee', 'Primary decision-making committee for the organization', 'exec@dev-org.org', true),
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Membership Committee', 'Handles membership applications and renewals', 'membership@dev-org.org', true);
 
-- Insert default committee positions
INSERT INTO committee_positions (committee_id, title, description, can_send_emails, permissions, display_order) VALUES
((SELECT id FROM committees WHERE name='Executive Committee' LIMIT 1), 'President', 'Overall leadership and strategic direction', true, '["manage_organization", "manage_memberships"]'::jsonb, 1),
((SELECT id FROM committees WHERE name='Executive Committee' LIMIT 1), 'Vice President', 'Assists president', true, '["manage_memberships"]'::jsonb, 2);
 
-- Insert default resources
INSERT INTO resources (organization_id, name, description, resource_type, capacity, is_active) VALUES
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Main Meeting Room', 'Large meeting room suitable for up to 50 people', 'meeting_room', 50, true),
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Training Room', 'Medium room with projector', 'training_room', 25, true);
 
-- Insert default forum categories
INSERT INTO forum_categories (organization_id, name, description, display_order, is_active) VALUES
('50d40a41-26a5-4a69-be77-c00c84367e50', 'General Discussion', 'General topics and announcements', 1, true),
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Events & Activities', 'Discussion about upcoming events and activities', 2, true),
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Member Resources', 'Share resources, tips, and information', 3, true),
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Technical Support', 'Get help with technical issues', 4, true);
 
-- Insert default mailing lists
INSERT INTO mailing_lists (organization_id, name, email, description, list_type, auto_sync, access_level) VALUES
('50d40a41-26a5-4a69-be77-c00c84367e50', 'All Members', 'all-members@dev-org.org', 'All current members', 'auto', true, 'public'),
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Committee Members', 'committee@dev-org.org', 'All committee members', 'manual', false, 'private'),
('50d40a41-26a5-4a69-be77-c00c84367e50', 'New Members', 'new-members@dev-org.org', 'Recently joined members', 'manual', false, 'public');
 
-- Insert default workflows
INSERT INTO workflows (organization_id, name, trigger_type, trigger_config, actions, is_active) VALUES
('50d40a41-26a5-4a69-be77-c00c84367e50', 'New Member Welcome', 'membership_approved', '{}'::jsonb, '["send_welcome_email", "add_to_mailing_list"]'::jsonb, true),
('50d40a41-26a5-4a69-be77-c00c84367e50', 'Membership Expiry Reminder', 'membership_expiring', '{"days_before": 30}'::jsonb, '["send_renewal_email"]'::jsonb, true);
 
-- Insert sample memberships
INSERT INTO memberships (organization_id, user_id, membership_type_id, status, start_date, end_date, approved_by) VALUES
('50d40a41-26a5-4a69-be77-c00c84367e50', '57970162-4d6b-4896-99a0-974d395b5454', (SELECT id FROM membership_types WHERE slug='adult' LIMIT 1), 'active', '2025-01-01', '2025-12-31', '57970162-4d6b-4896-99a0-974d395b5454');
 
-- Assign admin to committee position
INSERT INTO committee_members (committee_id, user_id, position_id, start_date, is_active) VALUES
((SELECT id FROM committees WHERE name='Executive Committee' LIMIT 1), '57970162-4d6b-4896-99a0-974d395b5454', (SELECT id FROM committee_positions WHERE title='President' LIMIT 1), '2025-01-01', true);
 
