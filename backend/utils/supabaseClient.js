const { supabase, supabaseAdmin } = require('../config/supabase');

class SupabaseClient {
  constructor() {
    this.client = supabase;
    this.admin = supabaseAdmin;
  }

  // Generic query methods
  async from(table) {
    return this.client.from(table);
  }

  async adminFrom(table) {
    return this.admin.from(table);
  }

  // User management methods
  async getUser(userId) {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data, error };
  }

  async getUserByEmail(email) {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    return { data, error };
  }

  async createUser(userData) {
    const { data, error } = await this.admin
      .from('users')
      .insert([userData])
      .select()
      .single();
    
    return { data, error };
  }

  async updateUser(userId, updates) {
    const { data, error } = await this.client
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    return { data, error };
  }

  async deleteUser(userId) {
    const { data, error } = await this.admin
      .from('users')
      .delete()
      .eq('id', userId);
    
    return { data, error };
  }

  // Organization methods
  async getOrganization(orgId) {
    const { data, error } = await this.client
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();
    
    return { data, error };
  }

  async getOrganizationBySlug(slug) {
    const { data, error } = await this.client
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .single();
    
    return { data, error };
  }

  // Membership methods
  async getMemberships(userId) {
    const { data, error } = await this.client
      .from('memberships')
      .select(`
        *,
        membership_types (
          id,
          name,
          price,
          duration_months
        )
      `)
      .eq('user_id', userId);
    
    return { data, error };
  }

  async createMembership(membershipData) {
    const { data, error } = await this.client
      .from('memberships')
      .insert([membershipData])
      .select()
      .single();
    
    return { data, error };
  }

  async updateMembership(membershipId, updates) {
    const { data, error } = await this.client
      .from('memberships')
      .update(updates)
      .eq('id', membershipId)
      .select()
      .single();
    
    return { data, error };
  }

  // Event methods
  async getEvents(organizationId, filters = {}) {
    let query = this.client
      .from('events')
      .select('*')
      .eq('organization_id', organizationId);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.isPublic !== undefined) {
      query = query.eq('is_public', filters.isPublic);
    }
    if (filters.startDate) {
      query = query.gte('start_date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('end_date', filters.endDate);
    }

    const { data, error } = await query.order('start_date', { ascending: true });
    
    return { data, error };
  }

  async createEvent(eventData) {
    const { data, error } = await this.client
      .from('events')
      .insert([eventData])
      .select()
      .single();
    
    return { data, error };
  }

  async updateEvent(eventId, updates) {
    const { data, error } = await this.client
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single();
    
    return { data, error };
  }

  async deleteEvent(eventId) {
    const { data, error } = await this.client
      .from('events')
      .delete()
      .eq('id', eventId);
    
    return { data, error };
  }

  // Document methods
  async getDocuments(organizationId, filters = {}) {
    let query = this.client
      .from('documents')
      .select('*')
      .eq('organization_id', organizationId);

    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.visibility) {
      query = query.eq('visibility', filters.visibility);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    return { data, error };
  }

  async createDocument(documentData) {
    const { data, error } = await this.client
      .from('documents')
      .insert([documentData])
      .select()
      .single();
    
    return { data, error };
  }

  async updateDocument(documentId, updates) {
    const { data, error } = await this.client
      .from('documents')
      .update(updates)
      .eq('id', documentId)
      .select()
      .single();
    
    return { data, error };
  }

  async deleteDocument(documentId) {
    const { data, error } = await this.client
      .from('documents')
      .delete()
      .eq('id', documentId);
    
    return { data, error };
  }

  // Forum methods
  async getForumCategories(organizationId) {
    const { data, error } = await this.client
      .from('forum_categories')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    return { data, error };
  }

  async getForumTopics(categoryId, filters = {}) {
    let query = this.client
      .from('forum_topics')
      .select(`
        *,
        users (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('category_id', categoryId);

    if (filters.isPinned !== undefined) {
      query = query.eq('is_pinned', filters.isPinned);
    }
    if (filters.isLocked !== undefined) {
      query = query.eq('is_locked', filters.isLocked);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    return { data, error };
  }

  async createForumTopic(topicData) {
    const { data, error } = await this.client
      .from('forum_topics')
      .insert([topicData])
      .select()
      .single();
    
    return { data, error };
  }

  async createForumReply(replyData) {
    const { data, error } = await this.client
      .from('forum_replies')
      .insert([replyData])
      .select()
      .single();
    
    return { data, error };
  }

  // Survey methods
  async getSurveys(organizationId, filters = {}) {
    let query = this.client
      .from('surveys')
      .select('*')
      .eq('organization_id', organizationId);

    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    if (filters.startDate) {
      query = query.gte('start_date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('end_date', filters.endDate);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    return { data, error };
  }

  async createSurvey(surveyData) {
    const { data, error } = await this.client
      .from('surveys')
      .insert([surveyData])
      .select()
      .single();
    
    return { data, error };
  }

  async updateSurvey(surveyId, updates) {
    const { data, error } = await this.client
      .from('surveys')
      .update(updates)
      .eq('id', surveyId)
      .select()
      .single();
    
    return { data, error };
  }

  async deleteSurvey(surveyId) {
    const { data, error } = await this.client
      .from('surveys')
      .delete()
      .eq('id', surveyId);
    
    return { data, error };
  }

  // Email campaign methods
  async getEmailCampaigns(organizationId, filters = {}) {
    let query = this.client
      .from('email_campaigns')
      .select('*')
      .eq('organization_id', organizationId);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    return { data, error };
  }

  async createEmailCampaign(campaignData) {
    const { data, error } = await this.client
      .from('email_campaigns')
      .insert([campaignData])
      .select()
      .single();
    
    return { data, error };
  }

  async updateEmailCampaign(campaignId, updates) {
    const { data, error } = await this.client
      .from('email_campaigns')
      .update(updates)
      .eq('id', campaignId)
      .select()
      .single();
    
    return { data, error };
  }

  async deleteEmailCampaign(campaignId) {
    const { data, error } = await this.client
      .from('email_campaigns')
      .delete()
      .eq('id', campaignId);
    
    return { data, error };
  }

  // Authentication methods
  async signUp(email, password, userData) {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      data: userData
    });
    
    return { data, error };
  }

  async signIn(email, password) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password
    });
    
    return { data, error };
  }

  async signOut() {
    const { error } = await this.client.auth.signOut();
    return { error };
  }

  async getCurrentUser() {
    const { data: { user }, error } = await this.client.auth.getUser();
    return { user, error };
  }

  async updateUserAuth(updates) {
    const { data, error } = await this.client.auth.updateUser(updates);
    return { data, error };
  }

  // Utility methods
  handleError(error) {
    if (error) {
      console.error('Supabase error:', error);
      return {
        success: false,
        error: error.message || 'An error occurred',
        details: error
      };
    }
    return null;
  }

  handleSuccess(data, message = 'Success') {
    return {
      success: true,
      data,
      message
    };
  }
}

module.exports = SupabaseClient;