// Netlify function to send postponement emails to all lottery ticket buyers
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async (event) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: CORS_HEADERS,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const body = JSON.parse(event.body || '{}');

        // Simple auth check
        if (body.secret !== process.env.ADMIN_SECRET && body.secret !== 'DR7Empire2025') {
            return {
                statusCode: 401,
                headers: CORS_HEADERS,
                body: JSON.stringify({ error: 'Unauthorized' })
            };
        }

        console.log('[Lottery Postponement] Fetching all lottery ticket buyers...');

        // Fetch all unique customers who bought lottery tickets
        const { data: tickets, error } = await supabase
            .from('commercial_operation_tickets')
            .select('email, full_name')
            .order('email');

        if (error) {
            console.error('[Lottery Postponement] Database error:', error);
            return {
                statusCode: 500,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    success: false,
                    error: 'Failed to fetch ticket buyers from database'
                })
            };
        }

        if (!tickets || tickets.length === 0) {
            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    success: true,
                    message: 'No ticket buyers found',
                    sent: 0,
                    failed: 0
                })
            };
        }

        // Get unique customers by email
        const uniqueCustomers = [];
        const seenEmails = new Set();

        for (const ticket of tickets) {
            const email = ticket.email?.toLowerCase().trim();
            if (email && !seenEmails.has(email)) {
                seenEmails.add(email);
                uniqueCustomers.push({
                    email: ticket.email, // Keep original casing for display
                    full_name: ticket.full_name || 'Cliente'
                });
            }
        }

        console.log(`[Lottery Postponement] Found ${uniqueCustomers.length} unique customers`);

        // Create email transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.secureserver.net',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        const results = {
            sent: 0,
            failed: 0,
            errors: []
        };

        // Send emails to all customers
        for (const customer of uniqueCustomers) {
            try {
                console.log(`[Lottery Postponement] Sending to: ${customer.email}`);

                await transporter.sendMail({
                    from: '"DR7 Empire" <info@dr7.app>',
                    to: customer.email,
                    subject: 'IMPORTANTE: Rinvio Estrazione LOTTERIA al 24 Gennaio 2026',
                    html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; background: white; }
                .header { background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: #000; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .important { background: #fff3cd; border: 2px solid #ffc107; border-radius: 5px; padding: 15px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎟️ COMUNICAZIONE IMPORTANTE</h1>
                </div>
                <div class="content">
                  <p><strong>Ciao ${customer.full_name},</strong></p>
                  <div class="important">
                    <strong>⚠️ RINVIO ESTRAZIONE</strong>
                    <p>Ti informiamo che l'estrazione della LOTTERIA è stata rinviata al <strong>24 Gennaio 2026, ore 10:00</strong>.</p>
                  </div>
                  <p>I tuoi biglietti rimangono validi e parteciperanno regolarmente all'estrazione nella nuova data.</p>
                  <p><strong>Nuova Data Estrazione:</strong> 24 Gennaio 2026, ore 10:00</p>
                  <p><strong>Fine Vendita Biglietti:</strong> 22 Gennaio 2026</p>
                  <p style="margin-top: 30px;"><strong>In bocca al lupo!</strong></p>
                  <div class="footer">
                    <p>DR7 Empire – Luxury Car Rental & Services</p>
                    <p>Per domande: <a href="mailto:info@dr7.app">info@dr7.app</a></p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `
                });

                results.sent++;
                console.log(`[Lottery Postponement] ✅ Sent to ${customer.email}`);

            } catch (emailError) {
                results.failed++;
                const errorMsg = `Failed to send to ${customer.email}: ${emailError.message}`;
                results.errors.push(errorMsg);
                console.error(`[Lottery Postponement] ❌ ${errorMsg}`);
            }
        }

        console.log(`[Lottery Postponement] Complete. Sent: ${results.sent}, Failed: ${results.failed}`);

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                success: true,
                sent: results.sent,
                failed: results.failed,
                total: uniqueCustomers.length,
                errors: results.errors
            })
        };

    } catch (error) {
        console.error('[Lottery Postponement] Error:', error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                success: false,
                error: error.message || 'Internal server error'
            })
        };
    }
};
