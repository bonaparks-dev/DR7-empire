/*
* Welcome Email Serverless Function
*
* This function is a placeholder designed to be triggered after a user successfully signs up.
* It simulates sending a welcome email.
*
* IMPORTANT: To make this function send actual emails, you must:
* 1. Choose an email service provider (e.g., Resend, SendGrid, Mailgun).
* 2. Sign up and get an API key.
* 3. Store the API key securely as an environment variable in your Netlify project settings
*    (e.g., `RESEND_API_KEY`).
* 4. Install the provider's Node.js SDK (e.g., `npm install resend`).
* 5. Replace the placeholder logic below with the actual implementation using the SDK.
*
* Note on OAuth (Google/social logins):
* For users signing up via OAuth, this client-side trigger will not work because of the redirect flow.
* The recommended way to send welcome emails for OAuth users is to set up a Webhook in your
* Supabase project that triggers this function whenever a new user is created in `auth.users`.
*/

// --- Example Implementation using Resend ---
//
// const { Resend } = require('resend');
//
// // Initialize Resend with your API key
// const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    const { email, name } = JSON.parse(event.body);

    if (!email || !name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email and name are required.' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    // --- Placeholder Logic ---
    // In a real application, you would use your email provider's SDK here.
    // This log simulates the action of sending an email.
    console.log(`[Welcome Email] Preparing to send email to: ${name} <${email}>`);

    /*
    // --- Example Resend Implementation ---
    await resend.emails.send({
      from: 'DR7 Empire <welcome@yourdomain.com>', // Must be a verified domain in Resend
      to: [email],
      subject: 'Welcome to the DR7 Empire!',
      html: `
        <div style="font-family: sans-serif; line-height: 1.6;">
          <h2>Welcome, ${name}!</h2>
          <p>Your account has been successfully created. You are now part of an exclusive community.</p>
          <p>Explore our world-class fleet of cars, yachts, villas, and private jets and book your next unforgettable experience.</p>
          <p>Best regards,<br/><strong>The DR7 Empire Team</strong></p>
        </div>
      `,
    });
    console.log(`[Welcome Email] Email sent successfully to ${email}`);
    */

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Welcome email request processed successfully.' }),
      headers: { 'Content-Type': 'application/json' },
    };

  } catch (error) {
    console.error('[Welcome Email] Error:', error);
    // In production, you might not want to expose detailed error messages.
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An internal server error occurred while sending the email.' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};