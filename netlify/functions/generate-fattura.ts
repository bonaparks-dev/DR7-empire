import { Handler } from '@netlify/functions';
import { getCorsOrigin } from './utils/cors';

const ADMIN_URL = process.env.ADMIN_URL || 'https://dr7-empire-admin.netlify.app';

/**
 * Proxy function to call the admin's generate-invoice-from-booking function.
 * This allows the website to trigger fattura generation server-to-server
 * (avoiding CORS issues from browser-side calls).
 */
export const handler: Handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': getCorsOrigin(event.headers['origin']),
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const { bookingId, includeIVA } = body;

        if (!bookingId) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'bookingId required' }) };
        }

        console.log(`[generate-fattura] Proxying to admin for booking ${bookingId}`);

        const response = await fetch(`${ADMIN_URL}/.netlify/functions/generate-invoice-from-booking`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId, includeIVA: includeIVA ?? true }),
        });

        const responseText = await response.text();

        if (!response.ok) {
            console.error(`[generate-fattura] Admin returned ${response.status}:`, responseText);
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({ error: 'Fattura generation failed', details: responseText }),
            };
        }

        console.log(`[generate-fattura] Success for booking ${bookingId}`);
        return { statusCode: 200, headers, body: responseText };
    } catch (error: any) {
        console.error('[generate-fattura] Error:', error.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal error', details: error.message }),
        };
    }
};
