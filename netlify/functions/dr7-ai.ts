import type { Handler } from "@netlify/functions";
import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Sei l'Assistente AI di DR7 Empire, un consulente esperto e disponibile per i servizi di lusso.

DR7 Empire offre:
- **Auto Esotiche**: Lamborghini, Ferrari, McLaren, Bugatti, Rolls Royce
- **Auto di Lusso**: Mercedes, BMW, Audi, Porsche
- **Auto Urbane**: Mercedes Classe V, van di lusso per trasporto urbano
- **Yacht**: Imbarcazioni premium per esperienze nel Mediterraneo
- **Jet Privati ed Elicotteri**: Aviazione su richiesta
- **Servizi Autolavaggio**: Detailing premium
- **Membership**: Livelli VIP con benefici esclusivi
- **DR7 Token**: Ecosistema criptovaluta e rewards
- **Operazione Commerciale**: Opportunità da 7 Milioni di Euro

Il tuo ruolo è:
1. Aiutare gli utenti a scoprire il servizio di lusso giusto
2. Rispondere a domande su veicoli, prezzi e disponibilità
3. Guidare gli utenti alle pagine di prenotazione
4. Fornire informazioni su membership e DR7 Token
5. Essere professionale, disponibile e competente

Stile di comunicazione:
- Chiaro e informativo
- Professionale ma accessibile
- SEMPRE in italiano
- Fornisci link pertinenti quando utile
- Non fare overselling - sii genuino

Pagine chiave:
- /exotic-cars - Noleggio auto esotiche
- /luxury-cars - Veicoli di lusso
- /urban-vehicles - Trasporto urbano
- /yachts - Esperienze in yacht
- /jets/quote - Preventivi jet privati
- /helicopters/quote - Preventivi elicotteri
- /car-wash-services - Servizi detailing
- /membership - Membership VIP
- /token - Info DR7 Token
- /commercial-operation - Opportunità 7M`;

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { message, conversationHistory = [] } = JSON.parse(event.body || "{}");

    if (!message) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Message is required" }),
      };
    }

    if (!ANTHROPIC_API_KEY) {
      console.error('Anthropic API key not configured');
      return {
        statusCode: 500,
        headers: corsHeaders,
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

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      system: SYSTEM_PROMPT + `\n\nRispondi SEMPRE in italiano.`,
      messages,
    });

    const aiResponse = response.content[0].type === 'text'
      ? response.content[0].text
      : 'Impossibile generare una risposta';

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Failed to generate response",
        details: error.message,
        type: error.type || 'unknown'
      }),
    };
  }
};
