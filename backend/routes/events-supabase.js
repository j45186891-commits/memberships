const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { authenticateToken, authorizeAdmin, authorizeOrganization } = require('../middleware/supabaseAuth');

// GET /api/events - Get all events for user's organization
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { status, isPublic, startDate, endDate } = req.query;

    let query = supabase
      .from('events')
      .select('*')
      .eq('organization_id', organization_id);

    if (status) query = query.eq('status', status);
    if (isPublic !== undefined) query = query.eq('is_public', isPublic === 'true');
    if (startDate) query = query.gte('start_date', startDate);
    if (endDate) query = query.lte('end_date', endDate);

    const { data, error } = await query.order('start_date', { ascending: true });

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching events',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: data,
      count: data.length
    });
  } catch (error) {
    console.error('Error in GET /api/events:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/events/:id - Get single event
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organization_id)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error in GET /api/events/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// POST /api/events - Create new event
router.post('/', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { organization_id } = req.user;
    const eventData = {
      ...req.body,
      organization_id,
      created_by: req.user.id
    };

    const { data, error } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Error creating event',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      data: data,
      message: 'Event created successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/events:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// PUT /api/events/:id - Update event
router.put('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;

    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organization_id)
      .single();

    if (fetchError || !existingEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const { data, error } = await supabase
      .from('events')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Error updating event',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: data,
      message: 'Event updated successfully'
    });
  } catch (error) {
    console.error('Error in PUT /api/events/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// DELETE /api/events/:id - Delete event
router.delete('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;

    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organization_id)
      .single();

    if (fetchError || !existingEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Error deleting event',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /api/events/:id:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/events/:id/registrations - Get event registrations
router.get('/:id/registrations', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;

    // Verify event exists and belongs to organization
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organization_id)
      .single();

    if (eventError || !event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Get registrations with user details
    const { data, error } = await supabase
      .from('event_registrations')
      .select(`
        *,
        users (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('event_id', id)
      .order('registered_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching registrations',
        error: error.message
      });
    }

    res.json({
      success: true,
      data: data,
      count: data.length
    });
  } catch (error) {
    console.error('Error in GET /api/events/:id/registrations:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// POST /api/events/:id/register - Register for event
router.post('/:id/register', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { organization_id } = req.user;

    // Check if event exists and is public or user is member
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organization_id)
      .single();

    if (eventError || !event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (!event.is_public && req.user.role === 'member') {
      return res.status(403).json({
        success: false,
        message: 'Event is not public'
      });
    }

    // Check registration deadline
    if (event.registration_deadline && new Date() > new Date(event.registration_deadline)) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed'
      });
    }

    // Check if already registered
    const { data: existingRegistration } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('event_id', id)
      .eq('user_id', userId)
      .single();

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'Already registered for this event'
      });
    }

    // Check max attendees
    if (event.max_attendees) {
      const { count } = await supabase
        .from('event_registrations')
        .select('id', { count: 'exact' })
        .eq('event_id', id)
        .eq('status', 'registered');

      if (count >= event.max_attendees) {
        return res.status(400).json({
          success: false,
          message: 'Event is full'
        });
      }
    }

    // Create registration
    const registrationData = {
      event_id: id,
      user_id: userId,
      status: 'registered',
      payment_status: event.price > 0 ? 'unpaid' : 'paid',
      notes: req.body.notes || null
    };

    const { data, error } = await supabase
      .from('event_registrations')
      .insert([registrationData])
      .select()
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Error creating registration',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      data: data,
      message: 'Successfully registered for event'
    });
  } catch (error) {
    console.error('Error in POST /api/events/:id/register:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;