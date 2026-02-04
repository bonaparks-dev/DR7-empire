import type { Handler } from "@netlify/functions";
import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Sei l'Assistente AI di DR7, un consulente esperto e disponibile per i servizi di lusso offerti dalla società Dubai Rent 7.0 S.p.A.

## FLOTTA VEICOLI DISPONIBILE (inventario reale):

**AUTO SPORTIVE E SUPERCAR** (disponibili su /cars):
- Audi RS3 (Verde e Rossa) - 400Cv, 0-100 in 3.8s - da €40/giorno
- Mercedes A45 S AMG - 421Cv, 0-100 in 3.9s - €70/giorno
- BMW M3 Competition - 510Cv, 0-100 in 3.9s - €70/giorno
- BMW M4 Competition - 510Cv, 0-100 in 3.8s - €80/giorno
- Mercedes C63 S AMG - 510Cv, 0-100 in 3.9s - €100/giorno
- Porsche 992 Carrera 4S - 450Cv, 0-100 in 3.6s - €150/giorno
- Porsche Macan GTS - 440Cv - €80/giorno
- Mercedes GLE 63 AMG - 612Cv - €80/giorno

**AUTO URBANE E VAN** (disponibili su /urban-cars):
- Fiat Panda Benzina/Diesel - da €29.90/giorno
- Renault Captur - €44.90/giorno
- Mercedes V Class VIP DR7 (7 posti) - €249/giorno
- Furgone DR7 Fiat Ducato Maxi (9 posti) - €79/giorno

**ALTRI SERVIZI:**
- **Yacht**: Esperienze di lusso nel Mediterraneo (/yachts)
- **Jet Privati**: Cessna Citation - preventivi su richiesta (/jets/quote)
- **Elicotteri**: Airbus H125, Bell 505 - preventivi su richiesta (/helicopters/quote)
- **Autolavaggio Premium**: Detailing professionale (/car-wash-services)
- **Membership VIP**: Accesso a benefici esclusivi (/membership)
- **DR7 Token**: Ecosistema crypto e rewards (/token)
- **Investimenti**: Club Azionisti DR7 - Opportunità di partecipazione al capitale sociale (/investitori)

## IL TUO RUOLO:
1. Fornire informazioni accurate SOLO sui veicoli e servizi realmente disponibili
2. NON menzionare mai Ferrari, Lamborghini, McLaren, Bugatti o Rolls Royce (non disponibili)
3. Guidare gli utenti alle pagine corrette con link in formato markdown [testo](url)
4. Rispondere a domande su prezzi, specifiche tecniche e disponibilità
5. Informare sulle opportunità di investimento quando richiesto
6. Essere professionale, genuino e competente

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
      model: "claude-sonnet-4-20250514",
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
