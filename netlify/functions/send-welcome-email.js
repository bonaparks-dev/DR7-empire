/*
* Welcome Email Serverless Function
*
* This function sends a welcome email using Resend when a user signs up.
*
* IMPORTANT: For this to work, you must configure the following environment variables in your Netlify project:
* 1. `RESEND_API_KEY`: Your secret API key from Resend.
* 2. `RESEND_SENDER_EMAIL`: The "from" email address. This MUST be an email from a domain you have verified in your Resend account (e.g., 'welcome@your-verified-domain.com').
* 3. `URL`: The main URL of your site (e.g., https://yourapp.netlify.app), which Netlify provides automatically.
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

  const { RESEND_API_KEY, RESEND_SENDER_EMAIL, URL } = process.env;

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

    const siteUrl = URL || 'https://dr7empire.com';
    const logoUrl = `${siteUrl}/DR7logo.png`;

    const htmlBody = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,400;0,700;1,400&family=Playfair+Display:ital,wght@0,700;1,700&display=swap" rel="stylesheet">
      <title>Welcome to DR7 Empire</title>
    </head>
    <body style="margin: 0; padding: 0; width: 100%; background-color: #020617; font-family: 'Exo 2', sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #020617;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 20px auto; background-color: #0f172a; border-radius: 8px; border: 1px solid #1e293b; padding: 40px; color: #cbd5e1;">
              <tr>
                <td align="center" style="padding-bottom: 20px;">
                  <img src="${logoUrl}" alt="DR7 Empire Logo" style="width: 80px; height: auto;">
                </td>
              </tr>
              <tr>
                <td align="center">
                  <h1 style="font-family: 'Playfair Display', serif; color: #ffffff; font-size: 28px; margin: 0 0 30px 0;">Welcome to the Empire, ${name}!</h1>
                </td>
              </tr>
              <tr>
                <td style="font-size: 16px; line-height: 1.6; padding-bottom: 20px;">
                  <p style="margin: 0;">We are thrilled to confirm that your DR7 Empire account has been created and is now active.</p>
                </td>
              </tr>
               <tr>
                <td style="font-size: 16px; line-height: 1.6; padding-bottom: 20px;">
                  <p style="margin: 0;">You now have access to our exclusive collection of supercars, yachts, villas, and private jets. Your journey into a world of unparalleled luxury starts now.</p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 20px 0;">
                  <a href="${siteUrl}/#/account" target="_blank" style="background-color: #ffffff; color: #000000; padding: 12px 24px; text-decoration: none; border-radius: 9999px; font-weight: bold; font-size: 14px; text-transform: uppercase;">Go to Your Account</a>
                </td>
              </tr>
               <tr>
                <td style="font-size: 16px; line-height: 1.6; padding-bottom: 30px;">
                  <p style="margin: 0;">You can manage your account settings and view your bookings at any time by visiting your dashboard.</p>
                </td>
              </tr>
              <tr>
                <td style="font-size: 16px; line-height: 1.6;">
                  Best regards,<br><strong style="color: #ffffff;">The DR7 Empire Team</strong>
                </td>
              </tr>
              <tr>
                <td style="border-top: 1px solid #1e293b; margin-top: 30px; padding-top: 20px; text-align: center; font-size: 12px; color: #64748b; padding-top: 30px;">
                  &copy; ${new Date().getFullYear()} DR7 Empire. All Rights Reserved.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    await resend.emails.send({
      from: `DR7 Empire <${RESEND_SENDER_EMAIL}>`,
      to: [email],
      subject: 'Welcome to DR7 Empire!',
      html: htmlBody,
    });
    
    console.log(`[Welcome Email] Email sent successfully to ${email}`);
    return createResponse(200, { success: true });

  } catch (error) {
    console.error('[Welcome Email] Error:', error);
    return createResponse(500, { success: false, error: error.message || 'An internal server error occurred while sending the email.' });
  }
};