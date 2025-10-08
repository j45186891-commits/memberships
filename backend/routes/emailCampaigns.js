const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { sendEmail } = require('../utils/emailService');

// Get all campaigns
router.get('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const result = await db.query(
      'SELECT * FROM email_campaigns WHERE organization_id = $1 ORDER BY created_at DESC',
      [req.user.organization_id]
    );
    res.json({ campaigns: result.rows });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to get campaigns' } });
  }
});

// Create campaign
router.post('/', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { name, template_id, subject, body_html, body_text, scheduled_at } = req.body;

    const result = await db.query(`
      INSERT INTO email_campaigns (organization_id, name, template_id, subject, body_html, body_text, status, scheduled_at, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7, $8)
      RETURNING *
    `, [req.user.organization_id, name, template_id, subject, body_html, body_text, scheduled_at, req.user.id]);

    res.status(201).json({ campaign: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to create campaign' } });
  }
});

// Send campaign
router.post('/:id/send', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { recipient_user_ids } = req.body;

    // Get campaign
    const campaignResult = await db.query(
      'SELECT * FROM email_campaigns WHERE id = $1 AND organization_id = $2',
      [req.params.id, req.user.organization_id]
    );

    if (campaignResult.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Campaign not found' } });
    }

    const campaign = campaignResult.rows[0];

    // Get recipients
    let recipients;
    if (recipient_user_ids && recipient_user_ids.length > 0) {
      const recipientsResult = await db.query(
        'SELECT id, email, first_name, last_name FROM users WHERE id = ANY($1)',
        [recipient_user_ids]
      );
      recipients = recipientsResult.rows;
    } else {
      const recipientsResult = await db.query(
        'SELECT id, email, first_name, last_name FROM users WHERE organization_id = $1 AND status = $2',
        [req.user.organization_id, 'active']
      );
      recipients = recipientsResult.rows;
    }

    // Create recipient records
    for (const recipient of recipients) {
      await db.query(`
        INSERT INTO email_campaign_recipients (campaign_id, user_id, status)
        VALUES ($1, $2, 'pending')
      `, [campaign.id, recipient.id]);
    }

    // Update campaign
    await db.query(
      'UPDATE email_campaigns SET status = $1, recipient_count = $2 WHERE id = $3',
      ['sending', recipients.length, campaign.id]
    );

    // Send emails asynchronously
    setImmediate(async () => {
      for (const recipient of recipients) {
        try {
          await sendEmail({
            to: recipient.email,
            subject: campaign.subject,
            html: campaign.body_html
          });

          await db.query(
            'UPDATE email_campaign_recipients SET status = $1, sent_at = CURRENT_TIMESTAMP WHERE campaign_id = $2 AND user_id = $3',
            ['sent', campaign.id, recipient.id]
          );
        } catch (error) {
          await db.query(
            'UPDATE email_campaign_recipients SET status = $1, error_message = $2 WHERE campaign_id = $3 AND user_id = $4',
            ['failed', error.message, campaign.id, recipient.id]
          );
        }
      }

      await db.query(
        'UPDATE email_campaigns SET status = $1, sent_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['sent', campaign.id]
      );
    });

    res.json({ message: 'Campaign is being sent', recipient_count: recipients.length });
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to send campaign' } });
  }
});

module.exports = router;