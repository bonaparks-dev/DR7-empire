// netlify/functions/create-checkout-session.ts
import { Handler } from "@netlify/functions";
import Stripe from "stripe";

// Initialise Stripe avec ta clé secrète définie dans Netlify → Environment Variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

export const handler: Handler = async (event) => {
  // Autorise uniquement la méthode POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // Récupère les données envoyées par le frontend
    const { carName, priceInCents } = JSON.parse(event.body || "{}");

    if (!carName || !priceInCents) {
      return { statusCode: 400, body: "Missing carName or priceInCents" };
    }

    // Détermine l'origine pour construire les URLs de retour
    const origin = event.headers.origin || process.env.SITE_URL || "http://localhost:8888";

    // Crée une session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: `Rental: ${carName}` },
            unit_amount: priceInCents, // ex: 50000 = 500,00€
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel`,
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err: any) {
    console.error("Stripe session error:", err);
    return { statusCode: 500, body: "Server Error" };
  }
};
