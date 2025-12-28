/**
 * Send notifications for Sandro Pisceddu's missing car wash booking
 * 
 * Instructions:
 * 1. First, run find_sandro_pisceddu_booking.sql in Supabase to get the booking ID
 * 2. Replace the BOOKING_ID below with the actual ID from the query result
 * 3. This can be run as a Netlify function or adapted to run in browser console
 */

const { createClient } = require('@supabase/supabase-js');

async function sendSandroBookingNotifications() {
    const BOOKING_ID = 'PASTE_BOOKING_ID_HERE'; // Replace with actual booking ID from SQL query

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase credentials');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        console.log('🔍 Fetching Sandro Pisceddu\'s booking...');

        const { data: booking, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', BOOKING_ID)
            .single();

        if (error || !booking) {
            console.error('❌ Could not find booking:', error);
            return;
        }

        console.log('✅ Found booking:', {
            id: booking.id,
            customer: booking.customer_name,
            email: booking.customer_email,
            phone: booking.customer_phone,
            service: booking.service_name,
            date: booking.appointment_date,
            time: booking.appointment_time,
            price: booking.price_total / 100,
            payment_status: booking.payment_status
        });

        // Send confirmation email
        console.log('📧 Sending confirmation email to customer and admin...');
        const emailResponse = await fetch(`${process.env.URL}/.netlify/functions/send-booking-confirmation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking })
        });

        if (emailResponse.ok) {
            console.log('✅ Confirmation email sent successfully!');
            console.log('   - Customer email:', booking.customer_email);
            console.log('   - Admin email: info@dr7.app');
        } else {
            const errorText = await emailResponse.text();
            console.error('❌ Email failed:', emailResponse.status, errorText);
        }

        // Send WhatsApp notification
        console.log('📱 Sending WhatsApp notification...');
        const whatsappResponse = await fetch(`${process.env.URL}/.netlify/functions/send-whatsapp-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking })
        });

        if (whatsappResponse.ok) {
            console.log('✅ WhatsApp notification sent successfully!');
        } else {
            console.error('❌ WhatsApp notification failed:', whatsappResponse.status);
        }

        console.log('\n✅ All notifications sent for Sandro Pisceddu\'s booking!');
        console.log('📋 Booking details:');
        console.log(`   - Service: ${booking.service_name}`);
        console.log(`   - Date: ${new Date(booking.appointment_date).toLocaleDateString('it-IT')}`);
        console.log(`   - Time: ${booking.appointment_time}`);
        console.log(`   - Total: €${booking.price_total / 100}`);

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Export for use as Netlify function or run directly
if (require.main === module) {
    sendSandroBookingNotifications();
}

module.exports = { handler: sendSandroBookingNotifications };
