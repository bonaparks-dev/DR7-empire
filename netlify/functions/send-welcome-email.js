/*
* Welcome Email Serverless Function
*
* This function sends a welcome email using Resend when a user signs up.
*
* IMPORTANT: For this to work, you must configure the following environment variables in your Netlify project:
* 1. `RESEND_API_KEY`: Your secret API key from Resend.
* 2. `RESEND_SENDER_EMAIL`: The "from" email address. This MUST be an email from a domain you have verified in your Resend account (e.g., 'welcome@your-verified-domain.com').
*
* Also, ensure the 'resend' package is listed in your project's package.json file.
*/

const { Resend } = require('resend');

/**
 * Creates a standard JSON response with CORS headers.
 * @param {number} statusCode - The HTTP status code.
 * @param {object} body - The response body.
 * @returns {object} The formatted response object.
 */
const createResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return createResponse(405, { success: false, error: 'Method Not Allowed' });
  }

  const { RESEND_API_KEY, RESEND_SENDER_EMAIL } = process.env;

  if (!RESEND_API_KEY || !RESEND_SENDER_EMAIL) {
    console.error('[Welcome Email] Email service is not configured. Missing RESEND_API_KEY or RESEND_SENDER_EMAIL.');
    return createResponse(500, { success: false, error: 'Email service is not configured.' });
  }

  try {
    if (!event.body) {
      return createResponse(400, { success: false, error: 'Request body is missing.' });
    }
    const { email, name } = JSON.parse(event.body);

    if (!email || !name) {
      return createResponse(400, { success: false, error: 'Email and name are required.' });
    }
    
    const resend = new Resend(RESEND_API_KEY);

    // --- Resend Implementation ---
    await resend.emails.send({
      from: `DR7 Empire <${RESEND_SENDER_EMAIL}>`,
      to: [email],
      subject: 'Welcome to DR7 Exotic!',
      html: `
        <div style="font-family: 'Exo 2', sans-serif; line-height: 1.6; color: #e5e7eb; background-color: #111827; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background-color: #1f2937; border-radius: 8px; padding: 30px; border: 1px solid #374151;">
            <h2 style="color: #ffffff; font-family: 'Playfair Display', serif;">Welcome, ${name}!</h2>
            <p>Your account has been successfully created. You are now part of an exclusive community dedicated to the pinnacle of luxury.</p>
            <p>Explore our world-class fleet of cars, yachts, villas, and private jets and book your next unforgettable experience.</p>
            <p style="margin-top: 30px;">Best regards,<br/><strong>The DR7 Empire Team</strong></p>
          </div>
        </div>
      `,
    });
    
    console.log(`[Welcome Email] Email sent successfully to ${email}`);

    return createResponse(200, { success: true });

  } catch (error) {
    console.error('[Welcome Email] Error:', error);
    return createResponse(500, { success: false, error: error.message || 'An internal server error occurred while sending the email.' });
  }
};
