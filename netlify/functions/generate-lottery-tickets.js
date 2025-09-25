// netlify/functions/generate-lottery-tickets.js

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const { randomUUID } = require('crypto');

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

/**
 * Generates a specified number of unique random integers within a given range.
 * @param {number} count - The number of unique numbers to generate.
 * @param {number} min - The minimum value of the range (inclusive).
 * @param {number} max - The maximum value of the range (inclusive).
 * @returns {number[]} An array of unique random numbers.
 */
const generateUniqueNumbers = (count, min, max) => {
  // In a production environment, you would need a persistent database
  // to guarantee uniqueness across all purchases for the entire lottery.
  // This implementation only guarantees uniqueness within a single request.
  const numbers = new Set();
  while (numbers.size < count) {
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    numbers.add(randomNumber);
  }
  return Array.from(numbers);
};

const generateEmailHtml = (fullName, tickets) => {
  const ticketBlocks = tickets.map(ticket => `
    <div style="background-color: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 20px; margin-bottom: 15px; text-align: center;">
      <p style="margin: 0 0 10px; font-size: 16px; color: #ccc;">Lottery Number:</p>
      <p style="margin: 0 0 15px; font-size: 32px; font-weight: bold; color: #fff; letter-spacing: 2px;">${ticket.number.toString().padStart(6, '0')}</p>
      <div style="border-top: 1px dashed #555; margin: 15px 0;"></div>
      <p style="margin: 0 0 5px; font-size: 12px; color: #ccc; text-transform: uppercase;">Ticket Holder</p>
      <p style="margin: 0 0 15px; font-size: 18px; font-weight: bold; color: #fff;">${fullName}</p>
      <div style="margin-top: 15px; position: relative; display: inline-block; width: 128px; height: 128px;">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${ticket.uuid}&ecc=H" alt="Ticket QR Code" style="width: 120px; height: 120px; display: block; border: 4px solid white; border-radius: 4px;">
        <img src="https://firebasestorage.googleapis.com/v0/b/dr7-empire.appspot.com/o/DR7logo.png?alt=media" alt="DR7 Logo" style="position: absolute; top: 50%; left: 50%; width: 36px; height: 36px; margin-top: -20px; margin-left: -20px; background: white; padding: 2px; border-radius: 4px;">
      </div>
      <p style="margin: 10px 0 0; font-size: 10px; color: #777; font-family: monospace; line-height: 1.4;">
        ID: ${ticket.uuid}
      </p>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your DR7 Lottery Tickets</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@400;700&display=swap');
        body { margin: 0; padding: 0; background-color: #000000; font-family: 'Exo 2', sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; color: #ffffff; }
        .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #333; }
        .content { padding: 30px 0; }
        .footer { text-align: center; font-size: 12px; color: #777; padding-top: 20px; border-top: 1px solid #333; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://firebasestorage.googleapis.com/v0/b/dr7-empire.appspot.com/o/DR7logo.png?alt=media" alt="DR7 Empire Logo" style="height: 50px; width: auto; margin-bottom: 10px;">
        </div>
        <div class="content">
          <h1 style="font-size: 28px; color: #fff; text-align: center;">Your Lottery Tickets Are Here!</h1>
          <p style="font-size: 16px; color: #ccc; line-height: 1.6; text-align: center;">Hello ${fullName},</p>
          <p style="font-size: 16px; color: #ccc; line-height: 1.6; text-align: center;">Thank you for participating in the DR7 Christmas Grand Giveaway. Below are your official ticket details. Please keep this email safe.</p>
          <div style="margin-top: 30px;">
            ${ticketBlocks}
          </div>
          <p style="font-size: 16px; color: #ccc; line-height: 1.6; text-align: center; margin-top: 30px;">Good luck! The draw will be held on Christmas Day.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} DR7 Empire. All Rights Reserved.
        </div>
      </div>
    </body>
    </html>
  `;
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } };
  }
  if (event.httpMethod !== 'POST') {
    return createResponse(405, { success: false, error: 'Method Not Allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.RESEND_API_KEY) {
    console.error('One or more required environment variables are not set.');
    return createResponse(500, { success: false, error: 'Server configuration error.' });
  }
  
  try {
    const { email, fullName, quantity, paymentIntentId } = JSON.parse(event.body);

    if (!email || !quantity || !paymentIntentId) {
      return createResponse(400, { success: false, error: 'Missing required fields.' });
    }

    // 1. Verify Payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded' || paymentIntent.metadata.email !== email) {
      return createResponse(400, { success: false, error: 'Invalid payment verification.' });
    }

    // 2. Generate Tickets
    const ticketNumbers = generateUniqueNumbers(quantity, 1, 350000);
    const tickets = ticketNumbers.map(number => {
        const uuid = randomUUID();
        return { number, uuid };
    });

    // 3. Send Email with Resend
    const emailHtml = generateEmailHtml(fullName || 'Valued Customer', tickets);
    
    await resend.emails.send({
      from: 'DR7 Empire <noreply@dr7empire.com>', // Ensure this domain is verified in Resend
      to: [email],
      subject: 'Your DR7 Lottery Tickets',
      html: emailHtml,
    });

    return createResponse(200, { success: true, tickets });

  } catch (error) {
    console.error('Error generating lottery tickets:', error);
    return createResponse(500, { success: false, error: error.message || 'An internal server error occurred.' });
  }
};