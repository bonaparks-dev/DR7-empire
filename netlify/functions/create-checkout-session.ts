// netlify/functions/create-checkout-session.ts
import { Handler } from "@netlify/functions";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { carName, priceInCents } = JSON.parse(event.body || "{}");
    if (!carName || !priceInCents) {
      return { statusCode: 400, body: "Missing carName or priceInCents" };
    }

    // Base URL priorisée pour prod custom domain
    const baseUrl =
      process.env.SITE_URL ||           // ⇦ fixe à https://dr7empire.com
      process.env.URL ||                // Netlify production URL (custom domain si configuré)
      process.env.DEPLOY_PRIME_URL ||   // URL des deploy previews
      "https://dr7empire.com";          // fallback

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: `Rental: ${carName}` },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancel`,
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
