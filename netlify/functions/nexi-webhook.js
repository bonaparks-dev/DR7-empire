// netlify/functions/nexi-webhook.js

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Verify MAC signature from Nexi
 */
function verifyMAC(params, receivedMac, macKey) {
    const sortedKeys = Object.keys(params).sort();

    let macString = '';
    for (const key of sortedKeys) {
        if (key !== 'mac' && params[key] !== undefined && params[key] !== null && params[key] !== '') {
            macString += `${key}=${params[key]}`;
        }
    }

    macString += macKey;
    const calculatedMac = crypto.createHash('sha1').update(macString, 'utf8').digest('hex');

    return calculatedMac === receivedMac;
}

/**
 * Netlify Function to handle Nexi payment webhooks (S2S callbacks)
 */
exports.handler = async (event) => {
    console.log('[Nexi Webhook] Received callback');

    try {
        // Parse the callback data
        const params = event.queryStringParameters || {};

        console.log('[Nexi Webhook] Params:', JSON.stringify(params, null, 2));

        const {
            codTrans,      // Order ID
            esito,         // Payment result (OK, KO, ANNULLO)
            importo,       // Amount in cents
            divisa,        // Currency
            data,          // Transaction date
            orario,        // Transaction time
            codAut,        // Authorization code
            mac,           // MAC signature
            messaggio,     // Message
            mail,          // Customer email
        } = params;

        // Verify MAC signature
        const macKey = process.env.NEXI_MAC_KEY;
        if (!macKey) {
            console.error('[Nexi Webhook] MAC key not configured');
            return {
                statusCode: 500,
                body: 'Configuration error',
            };
        }

        const isValidMac = verifyMAC(params, mac, macKey);
        if (!isValidMac) {
            console.error('[Nexi Webhook] Invalid MAC signature');
            return {
                statusCode: 400,
                body: 'Invalid signature',
            };
        }

        console.log('[Nexi Webhook] MAC signature verified');

        // Check payment result
        if (esito === 'OK') {
            console.log('[Nexi Webhook] Payment successful:', codTrans);

            // Update booking in database
            const { data: booking, error: fetchError } = await supabase
                .from('bookings')
                .select('*')
                .eq('nexi_order_id', codTrans)
                .maybeSingle();

            if (fetchError) {
                console.error('[Nexi Webhook] Error fetching booking:', fetchError);
            }

            if (booking) {
                // Update booking with payment details
                const { error: updateError } = await supabase
                    .from('bookings')
                    .update({
                        payment_status: 'paid',
                        nexi_payment_id: codAut,
                        nexi_transaction_date: `${data} ${orario}`,
                        payment_provider: 'nexi',
                    })
                    .eq('id', booking.id);

                if (updateError) {
                    console.error('[Nexi Webhook] Error updating booking:', updateError);
                } else {
                    console.log('[Nexi Webhook] Booking updated successfully');
                }

                // Send WhatsApp notification if it's a ticket purchase
                if (booking.booking_type === 'commercial_operation') {
                    try {
                        await fetch(`${process.env.URL}/.netlify/functions/send-whatsapp-notification`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                type: 'ticket',
                                ticket: {
                                    customer_name: booking.customer_name || 'Cliente',
                                    customer_email: mail,
                                    quantity: booking.quantity || 1,
                                    total_price: parseInt(importo),
                                    ticket_numbers: booking.ticket_numbers || []
                                }
                            })
                        });
                        console.log('[Nexi Webhook] WhatsApp notification sent');
                    } catch (error) {
                        console.error('[Nexi Webhook] Failed to send WhatsApp notification:', error);
                    }
                }
            } else {
                console.log('[Nexi Webhook] No booking found for order:', codTrans);
            }

            // Return success response to Nexi
            return {
                statusCode: 200,
                body: 'OK',
            };
        } else if (esito === 'KO') {
            console.log('[Nexi Webhook] Payment failed:', codTrans, messaggio);

            // Update booking status to failed
            await supabase
                .from('bookings')
                .update({
                    payment_status: 'failed',
                    payment_error: messaggio,
                })
                .eq('nexi_order_id', codTrans);

            return {
                statusCode: 200,
                body: 'Payment failed',
            };
        } else if (esito === 'ANNULLO') {
            console.log('[Nexi Webhook] Payment cancelled:', codTrans);

            // Update booking status to cancelled
            await supabase
                .from('bookings')
                .update({
                    payment_status: 'cancelled',
                })
                .eq('nexi_order_id', codTrans);

            return {
                statusCode: 200,
                body: 'Payment cancelled',
            };
        }

        return {
            statusCode: 200,
            body: 'Received',
        };

    } catch (error) {
        console.error('[Nexi Webhook] Error processing webhook:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message,
            }),
        };
    }
};
