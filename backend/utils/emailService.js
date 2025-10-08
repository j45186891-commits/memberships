const nodemailer = require('nodemailer');
const handlebars = require('handlebars');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
};

// Send email
const sendEmail = async ({ to, subject, html, text, from }) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: from || `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '')
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

// Send templated email
const sendTemplatedEmail = async (db, { to, templateSlug, variables, organizationId }) => {
  try {
    // Get template
    const result = await db.query(
      'SELECT * FROM email_templates WHERE slug = $1 AND organization_id = $2 AND is_active = true',
      [templateSlug, organizationId]
    );

    if (result.rows.length === 0) {
      throw new Error('Template not found');
    }

    const template = result.rows[0];

    // Compile template
    const subjectTemplate = handlebars.compile(template.subject);
    const bodyTemplate = handlebars.compile(template.body_html);

    const subject = subjectTemplate(variables);
    const html = bodyTemplate(variables);

    return await sendEmail({ to, subject, html });
  } catch (error) {
    console.error('Templated email error:', error);
    return { success: false, error: error.message };
  }
};

// Send bulk emails
const sendBulkEmails = async (emails) => {
  const results = [];
  
  for (const email of emails) {
    const result = await sendEmail(email);
    results.push({ ...email, ...result });
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
};

module.exports = {
  sendEmail,
  sendTemplatedEmail,
  sendBulkEmails
};