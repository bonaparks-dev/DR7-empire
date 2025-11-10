import type { Handler } from "@netlify/functions";

const CALLMEBOT_PHONE = process.env.CALLMEBOT_PHONE; // Your phone number
const CALLMEBOT_API_KEY = "6526748";

interface QuoteData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  departure_location: string;
  arrival_location: string;
  flight_type: string;
  departure_date: string;
  passenger_count: number;
  notes?: string;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const quote: QuoteData = JSON.parse(event.body || "{}");

    // Format the WhatsApp message
    const flightType = quote.flight_type === 'round_trip' ? 'Andata/Ritorno' : 'Solo Andata';

    const message = `🚁 *NUOVA RICHIESTA PREVENTIVO JET/ELICOTTERO*

👤 *Cliente:* ${quote.customer_name}
📧 *Email:* ${quote.customer_email}
📱 *Tel:* ${quote.customer_phone}

✈️ *Volo:*
📍 Da: ${quote.departure_location}
📍 A: ${quote.arrival_location}
🔄 Tipo: ${flightType}
📅 Partenza: ${quote.departure_date}
👥 Passeggeri: ${quote.passenger_count}

${quote.notes ? `💬 Note: ${quote.notes}` : ''}

⚡ Rispondi entro 24 ore!`;

    // Send via CallMeBot
    const encodedMessage = encodeURIComponent(message);
    const callmebotUrl = `https://api.callmebot.com/whatsapp.php?phone=${CALLMEBOT_PHONE}&text=${encodedMessage}&apikey=${CALLMEBOT_API_KEY}`;

    const response = await fetch(callmebotUrl);

    if (!response.ok) {
      throw new Error(`CallMeBot API error: ${response.statusText}`);
    }

    console.log('✅ WhatsApp notification sent for aviation quote');

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        message: "WhatsApp notification sent successfully",
      }),
    };
  } catch (error) {
    console.error("Error sending WhatsApp notification:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to send WhatsApp notification",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
