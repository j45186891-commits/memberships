#!/usr/bin/env node

/**
 * Migration script to transfer data from local PostgreSQL to Supabase
 * Run with: node migrate-to-supabase.js
 */

const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Local PostgreSQL connection
const localPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'membership_app',
  user: process.env.DB_USER || 'membership_user',
  password: process.env.DB_PASSWORD || 'membership_pass',
});

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL || 'https://tdqwgjbkkldvioxzator.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkcXdnamJra2xkdmlveHphdG9yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA0ODA5MiwiZXhwIjoyMDc1NjI0MDkyfQ.CETODpNxEJ1tRouJ0RGm5k9D1vgThlywHmddbSa8_-c';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function migrateOrganizations() {
  console.log('📁 Migrating organizations...');
  
  try {
    const result = await localPool.query('SELECT * FROM organizations');
    const organizations = result.rows;
    
    console.log(`Found ${organizations.length} organizations`);
    
    for (const org of organizations) {
      const { data, error } = await supabase
        .from('organizations')
        .insert([{
          id: org.id,
          name: org.name,
          slug: org.slug,
          email: org.email,
          phone: org.phone,
          address: org.address,
          logo_url: org.logo_url,
          primary_color: org.primary_color,
          secondary_color: org.secondary_color,
          timezone: org.timezone,
          currency: org.currency,
          settings: org.settings,
          created_at: org.created_at,
          updated_at: org.updated_at
        }])
        .select();
      
      if (error) {
        console.error(`Error migrating organization ${org.name}:`, error.message);
      } else {
        console.log(`✅ Migrated organization: ${org.name}`);
      }
    }
    
    console.log('✅ Organizations migration complete');
  } catch (error) {
    console.error('❌ Error migrating organizations:', error);
  }
}

async function migrateUsers() {
  console.log('👥 Migrating users...');
  
  try {
    const result = await localPool.query('SELECT * FROM users');
    const users = result.rows;
    
    console.log(`Found ${users.length} users`);
    
    for (const user of users) {
      // Create user in Supabase Auth first
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          email_confirm: user.email_verified,
          user_metadata: {
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role
          }
        });

        if (authError) {
          console.error(`Error creating auth user for ${user.email}:`, authError.message);
          continue;
        }

        // Then insert user data into users table
        const { data, error } = await supabase
          .from('users')
          .insert([{
            id: authData.user.id,
            organization_id: user.organization_id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            role: user.role,
            status: user.status,
            email_verified: user.email_verified,
            two_factor_enabled: user.two_factor_enabled,
            two_factor_secret: user.two_factor_secret,
            last_login: user.last_login,
            login_count: user.login_count,
            created_at: user.created_at,
            updated_at: user.updated_at
          }])
          .select();

        if (error) {
          console.error(`Error migrating user ${user.email}:`, error.message);
        } else {
          console.log(`✅ Migrated user: ${user.email}`);
        }
      } catch (userError) {
        console.error(`Error processing user ${user.email}:`, userError.message);
      }
    }
    
    console.log('✅ Users migration complete');
  } catch (error) {
    console.error('❌ Error migrating users:', error);
  }
}

async function migrateMembershipTypes() {
  console.log('🏷️ Migrating membership types...');
  
  try {
    const result = await localPool.query('SELECT * FROM membership_types');
    const types = result.rows;
    
    console.log(`Found ${types.length} membership types`);
    
    for (const type of types) {
      const { data, error } = await supabase
        .from('membership_types')
        .insert([{
          id: type.id,
          organization_id: type.organization_id,
          name: type.name,
          slug: type.slug,
          description: type.description,
          price: type.price,
          duration_months: type.duration_months,
          max_members: type.max_members,
          requires_approval: type.requires_approval,
          is_active: type.is_active,
          settings: type.settings,
          created_at: type.created_at,
          updated_at: type.updated_at
        }])
        .select();
      
      if (error) {
        console.error(`Error migrating membership type ${type.name}:`, error.message);
      } else {
        console.log(`✅ Migrated membership type: ${type.name}`);
      }
    }
    
    console.log('✅ Membership types migration complete');
  } catch (error) {
    console.error('❌ Error migrating membership types:', error);
  }
}

async function migrateMemberships() {
  console.log('🎫 Migrating memberships...');
  
  try {
    const result = await localPool.query('SELECT * FROM memberships');
    const memberships = result.rows;
    
    console.log(`Found ${memberships.length} memberships`);
    
    for (const membership of memberships) {
      const { data, error } = await supabase
        .from('memberships')
        .insert([{
          id: membership.id,
          organization_id: membership.organization_id,
          user_id: membership.user_id,
          membership_type_id: membership.membership_type_id,
          status: membership.status,
          start_date: membership.start_date,
          end_date: membership.end_date,
          auto_renew: membership.auto_renew,
          payment_status: membership.payment_status,
          amount_paid: membership.amount_paid,
          custom_data: membership.custom_data,
          notes: membership.notes,
          approved_by: membership.approved_by,
          approved_at: membership.approved_at,
          created_at: membership.created_at,
          updated_at: membership.updated_at
        }])
        .select();
      
      if (error) {
        console.error(`Error migrating membership for user ${membership.user_id}:`, error.message);
      } else {
        console.log(`✅ Migrated membership for user: ${membership.user_id}`);
      }
    }
    
    console.log('✅ Memberships migration complete');
  } catch (error) {
    console.error('❌ Error migrating memberships:', error);
  }
}

async function migrateEvents() {
  console.log('📅 Migrating events...');
  
  try {
    const result = await localPool.query('SELECT * FROM events');
    const events = result.rows;
    
    console.log(`Found ${events.length} events`);
    
    for (const event of events) {
      const { data, error } = await supabase
        .from('events')
        .insert([{
          id: event.id,
          organization_id: event.organization_id,
          title: event.title,
          description: event.description,
          location: event.location,
          start_date: event.start_date,
          end_date: event.end_date,
          max_attendees: event.max_attendees,
          registration_deadline: event.registration_deadline,
          price: event.price,
          is_public: event.is_public,
          status: event.status,
          created_by: event.created_by,
          created_at: event.created_at,
          updated_at: event.updated_at
        }])
        .select();
      
      if (error) {
        console.error(`Error migrating event ${event.title}:`, error.message);
      } else {
        console.log(`✅ Migrated event: ${event.title}`);
      }
    }
    
    console.log('✅ Events migration complete');
  } catch (error) {
    console.error('❌ Error migrating events:', error);
  }
}

async function migrateDocuments() {
  console.log('📄 Migrating documents...');
  
  try {
    const result = await localPool.query('SELECT * FROM documents');
    const documents = result.rows;
    
    console.log(`Found ${documents.length} documents`);
    
    for (const document of documents) {
      const { data, error } = await supabase
        .from('documents')
        .insert([{
          id: document.id,
          organization_id: document.organization_id,
          title: document.title,
          description: document.description,
          file_name: document.file_name,
          file_path: document.file_path,
          file_size: document.file_size,
          mime_type: document.mime_type,
          category: document.category,
          visibility: document.visibility,
          download_count: document.download_count,
          uploaded_by: document.uploaded_by,
          created_at: document.created_at,
          updated_at: document.updated_at
        }])
        .select();
      
      if (error) {
        console.error(`Error migrating document ${document.title}:`, error.message);
      } else {
        console.log(`✅ Migrated document: ${document.title}`);
      }
    }
    
    console.log('✅ Documents migration complete');
  } catch (error) {
    console.error('❌ Error migrating documents:', error);
  }
}

async function migrateForumCategories() {
  console.log('💬 Migrating forum categories...');
  
  try {
    const result = await localPool.query('SELECT * FROM forum_categories');
    const categories = result.rows;
    
    console.log(`Found ${categories.length} forum categories`);
    
    for (const category of categories) {
      const { data, error } = await supabase
        .from('forum_categories')
        .insert([{
          id: category.id,
          organization_id: category.organization_id,
          name: category.name,
          description: category.description,
          display_order: category.display_order,
          is_active: category.is_active,
          created_at: category.created_at
        }])
        .select();
      
      if (error) {
        console.error(`Error migrating forum category ${category.name}:`, error.message);
      } else {
        console.log(`✅ Migrated forum category: ${category.name}`);
      }
    }
    
    console.log('✅ Forum categories migration complete');
  } catch (error) {
    console.error('❌ Error migrating forum categories:', error);
  }
}

async function migrateForumTopics() {
  console.log('📝 Migrating forum topics...');
  
  try {
    const result = await localPool.query('SELECT * FROM forum_topics');
    const topics = result.rows;
    
    console.log(`Found ${topics.length} forum topics`);
    
    for (const topic of topics) {
      const { data, error } = await supabase
        .from('forum_topics')
        .insert([{
          id: topic.id,
          category_id: topic.category_id,
          user_id: topic.user_id,
          title: topic.title,
          content: topic.content,
          is_pinned: topic.is_pinned,
          is_locked: topic.is_locked,
          view_count: topic.view_count,
          reply_count: topic.reply_count,
          last_reply_at: topic.last_reply_at,
          created_at: topic.created_at,
          updated_at: topic.updated_at
        }])
        .select();
      
      if (error) {
        console.error(`Error migrating forum topic ${topic.title}:`, error.message);
      } else {
        console.log(`✅ Migrated forum topic: ${topic.title}`);
      }
    }
    
    console.log('✅ Forum topics migration complete');
  } catch (error) {
    console.error('❌ Error migrating forum topics:', error);
  }
}

async function migrateSurveys() {
  console.log('📋 Migrating surveys...');
  
  try {
    const result = await localPool.query('SELECT * FROM surveys');
    const surveys = result.rows;
    
    console.log(`Found ${surveys.length} surveys`);
    
    for (const survey of surveys) {
      const { data, error } = await supabase
        .from('surveys')
        .insert([{
          id: survey.id,
          organization_id: survey.organization_id,
          title: survey.title,
          description: survey.description,
          questions: survey.questions,
          is_active: survey.is_active,
          start_date: survey.start_date,
          end_date: survey.end_date,
          created_by: survey.created_by,
          created_at: survey.created_at,
          updated_at: survey.updated_at
        }])
        .select();
      
      if (error) {
        console.error(`Error migrating survey ${survey.title}:`, error.message);
      } else {
        console.log(`✅ Migrated survey: ${survey.title}`);
      }
    }
    
    console.log('✅ Surveys migration complete');
  } catch (error) {
    console.error('❌ Error migrating surveys:', error);
  }
}

async function migrateEmailCampaigns() {
  console.log('📧 Migrating email campaigns...');
  
  try {
    const result = await localPool.query('SELECT * FROM email_campaigns');
    const campaigns = result.rows;
    
    console.log(`Found ${campaigns.length} email campaigns`);
    
    for (const campaign of campaigns) {
      const { data, error } = await supabase
        .from('email_campaigns')
        .insert([{
          id: campaign.id,
          organization_id: campaign.organization_id,
          name: campaign.name,
          subject: campaign.subject,
          body_html: campaign.body_html,
          body_text: campaign.body_text,
          status: campaign.status,
          scheduled_at: campaign.scheduled_at,
          sent_at: campaign.sent_at,
          recipient_count: campaign.recipient_count,
          opened_count: campaign.opened_count,
          clicked_count: campaign.clicked_count,
          created_by: campaign.created_by,
          created_at: campaign.created_at,
          updated_at: campaign.updated_at
        }])
        .select();
      
      if (error) {
        console.error(`Error migrating email campaign ${campaign.name}:`, error.message);
      } else {
        console.log(`✅ Migrated email campaign: ${campaign.name}`);
      }
    }
    
    console.log('✅ Email campaigns migration complete');
  } catch (error) {
    console.error('❌ Error migrating email campaigns:', error);
  }
}

async function migrateAll() {
  console.log('🚀 Starting migration to Supabase...');
  console.log('=====================================');
  
  try {
    await migrateOrganizations();
    await migrateUsers();
    await migrateMembershipTypes();
    await migrateMemberships();
    await migrateEvents();
    await migrateDocuments();
    await migrateForumCategories();
    await migrateForumTopics();
    await migrateSurveys();
    await migrateEmailCampaigns();
    
    console.log('=====================================');
    console.log('✅ Migration to Supabase complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await localPool.end();
    process.exit(0);
  }
}

// Run migration
if (require.main === module) {
  migrateAll();
}

module.exports = {
  migrateOrganizations,
  migrateUsers,
  migrateMembershipTypes,
  migrateMemberships,
  migrateEvents,
  migrateDocuments,
  migrateForumCategories,
  migrateForumTopics,
  migrateSurveys,
  migrateEmailCampaigns,
  migrateAll
};