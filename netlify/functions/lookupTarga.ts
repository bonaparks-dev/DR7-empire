import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getCorsOrigin } from './utils/cors';

const OPENAPI_TOKEN = process.env.OPENAPI_AUTOMOTIVE_TOKEN || '';

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    const headers = {
        'Access-Control-Allow-Origin': getCorsOrigin(event.headers['origin']),
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const plate = event.queryStringParameters?.plate?.toUpperCase().replace(/[\s\-]/g, '') || '';

    if (!plate || plate.length < 5 || plate.length > 8 || !/^[A-Z0-9]+$/.test(plate)) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Targa non valida. Inserisci una targa italiana (es. EX117YA).' }),
        };
    }

    if (!OPENAPI_TOKEN) {
        console.error('[lookupTarga] OPENAPI_AUTOMOTIVE_TOKEN not configured');
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Servizio temporaneamente non disponibile.' }),
        };
    }

    try {
        console.log('[lookupTarga] Looking up plate:', plate);

        const response = await fetch(`https://automotive.openapi.com/IT-car/${plate}`, {
            headers: { 'Authorization': `Bearer ${OPENAPI_TOKEN}` },
        });

        if (response.status === 404) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Targa non trovata. Verifica il numero e riprova.' }),
            };
        }

        if (!response.ok) {
            console.error('[lookupTarga] API error:', response.status, response.statusText);
            return {
                statusCode: 502,
                headers,
                body: JSON.stringify({ error: 'Errore nella ricerca. Riprova tra qualche istante.' }),
            };
        }

        const json = await response.json();

        if (!json.success || !json.data) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ error: 'Targa non trovata. Verifica il numero e riprova.' }),
            };
        }

        const { CarMake, CarModel, Description, RegistrationYear, FuelType } = json.data;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                plate,
                carMake: CarMake || '',
                carModel: CarModel || '',
                description: Description || '',
                registrationYear: RegistrationYear || '',
                fuelType: FuelType || '',
            }),
        };
    } catch (error: any) {
        console.error('[lookupTarga] Unexpected error:', error.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Errore nella ricerca. Riprova tra qualche istante.' }),
        };
    }
};
