import type { Handler } from "@netlify/functions";
import Anthropic from "@anthropic-ai/sdk";
import { getCorsOrigin } from './utils/cors';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getCorsHeaders(origin?: string) {
  return {
    'Access-Control-Allow-Origin': getCorsOrigin(origin),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

// Fetch live vehicle prices from database
async function getVehiclePrices(): Promise<string> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return '(Prezzi non disponibili - configurazione mancante)';
  }
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/vehicles?select=display_name,daily_rate,category,status,metadata&status=neq.retired&order=category.asc,display_name.asc`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const vehicles = await response.json();
    if (!Array.isArray(vehicles) || vehicles.length === 0) {
      return '(Nessun veicolo trovato)';
    }

    const exotic: string[] = [];
    const urban: string[] = [];

    for (const v of vehicles) {
      // Skip vehicles with booking disabled
      if (v.metadata?.booking_disabled) continue;

      const price = v.daily_rate;
      const priceStr = `da €${price}/giorno`;

      const line = `- ${v.display_name} - ${priceStr}`;

      if (v.category === 'exotic') {
        exotic.push(line);
      } else {
        urban.push(line);
      }
    }

    let result = '';
    if (exotic.length > 0) {
      result += `**AUTO SPORTIVE E SUPERCAR** (disponibili su /cars):\n${exotic.join('\n')}\n\n`;
    }
    if (urban.length > 0) {
      result += `**AUTO URBANE E VAN** (disponibili su /urban-cars):\n${urban.join('\n')}`;
    }
    return result;
  } catch (error) {
    console.error('Error fetching vehicle prices for AI:', error);
    return '(Errore nel recupero prezzi)';
  }
}

function buildSystemPrompt(vehiclePrices: string): string {
  return `Sei l'Assistente AI di DR7, un consulente esperto e disponibile per i servizi di lusso offerti dalla società Dubai Rent 7.0 S.p.A.

## FLOTTA VEICOLI DISPONIBILE (prezzi reali dal database):

${vehiclePrices}

**ALTRI SERVIZI:**
- **Yacht**: Esperienze di lusso nel Mediterraneo (/yachts)
- **Jet Privati**: Cessna Citation - preventivi su richiesta (/jets/quote)
- **Elicotteri**: Airbus H125, Bell 505 - preventivi su richiesta (/helicopters/quote)
- **Autolavaggio Premium**: Detailing professionale (/car-wash-services)
- **Membership VIP**: Accesso a benefici esclusivi (/membership)
- **DR7 Token**: Ecosistema crypto e rewards (/token)
- **Investimenti**: Club Azionisti DR7 - Opportunità di partecipazione al capitale sociale (/investitori)

## IL TUO RUOLO:
1. Fornire informazioni generali SOLO sui veicoli e servizi realmente disponibili
2. NON menzionare mai Ferrari, Lamborghini, McLaren, Bugatti o Rolls Royce (non disponibili)
3. Guidare gli utenti alle pagine corrette con link in formato markdown [testo](url)
4. Informare sulle opportunità di investimento quando richiesto
5. Essere professionale, genuino e competente

## REGOLE CRITICHE SUI PREZZI:
- NON fare MAI preventivi o calcoli di prezzo (es. "3 giorni = €X")
- NON moltiplicare MAI i prezzi per il numero di giorni
- Puoi indicare SOLO il prezzo giornaliero BASE come mostrato sopra, specificando sempre che è INDICATIVO
- Per il prezzo esatto, SEMPRE rimandare alla pagina di prenotazione: [Prenota qui](/cars) o [Auto urbane](/urban-cars)
- Il prezzo finale dipende da periodo, durata, assicurazione e servizi aggiuntivi
- Se il cliente chiede "quanto costa per X giorni", rispondi: "Il prezzo varia in base al periodo. Per un preventivo preciso, procedi con la prenotazione su [la nostra pagina](/cars) dove vedrai il prezzo finale esatto."

## INVESTIMENTI E AZIONARIATO:
Dubai Rent 7.0 S.p.A. offre opportunità di partecipazione al capitale sociale tramite il Club Azionisti DR7:
- Investimento minimo indicativo: €25.000
- Riservato a investitori qualificati
- Piano Vision 2030 per espansione internazionale
- Contatto: investor@dr7.app o WhatsApp +39 345 790 5205
- Dettagli completi su /investitori

## STILE DI COMUNICAZIONE:
- Chiaro, informativo e professionale
- SEMPRE in italiano
- Usa link markdown [testo](/pagina) per guidare gli utenti
- Non fare overselling - sii genuino e trasparente
- Rispondi solo su ciò che DR7 offre realmente

## PAGINE CHIAVE (usa questi path esatti):
- /cars - Auto sportive e supercar
- /urban-cars - Auto urbane e van
- /yachts - Yacht e imbarcazioni
- /jets/quote - Preventivi jet privati
- /helicopters/quote - Preventivi elicotteri
- /car-wash-services - Servizi autolavaggio
- /membership - Membership VIP
- /token - DR7 Token e crypto
- /investitori - Opportunità investimento azionario`;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: getCorsHeaders(event.headers['origin']),
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: getCorsHeaders(event.headers['origin']),
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { message, conversationHistory = [] } = JSON.parse(event.body || "{}");

    if (!message) {
      return {
        statusCode: 400,
        headers: getCorsHeaders(event.headers['origin']),
        body: JSON.stringify({ error: "Message is required" }),
      };
    }

    if (!ANTHROPIC_API_KEY) {
      console.error('Anthropic API key not configured');
      return {
        statusCode: 500,
        headers: getCorsHeaders(event.headers['origin']),
        body: JSON.stringify({ error: "AI service not configured" }),
      };
    }

    const anthropic = new Anthropic({
      apiKey: ANTHROPIC_API_KEY,
    });

    // Build messages array with conversation history
    const messages: Array<{ role: "user" | "assistant"; content: string }> = [
      ...conversationHistory,
      {
        role: "user",
        content: message,
      },
    ];

    // Fetch live prices from database
    const vehiclePrices = await getVehiclePrices();
    const systemPrompt = buildSystemPrompt(vehiclePrices);

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: systemPrompt + `\n\nRispondi SEMPRE in italiano.\n\nIMPORTANTE: Aggiungi SEMPRE alla fine di ogni risposta che include prezzi questa nota:\n"⚠️ *I prezzi indicati sono puramente indicativi. Il prezzo definitivo viene calcolato al momento della prenotazione e può variare in base a periodo, durata e disponibilità. Solo il prezzo mostrato nella pagina di prenotazione è vincolante.*"`,
      messages,
    });

    const aiResponse = response.content[0].type === 'text'
      ? response.content[0].text
      : 'Impossibile generare una risposta';

    return {
      statusCode: 200,
      headers: { ...getCorsHeaders(event.headers['origin']), 'Content-Type': 'application/json' },
      body: JSON.stringify({ response: aiResponse }),
    };
  } catch (error: any) {
    console.error("Error in DR7 AI function:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.status,
      type: error.type,
      stack: error.stack
    });
    return {
      statusCode: 500,
      headers: getCorsHeaders(event.headers['origin']),
      body: JSON.stringify({
        error: "Failed to generate response",
        details: error.message,
        type: error.type || 'unknown'
      }),
    };
  }
};
