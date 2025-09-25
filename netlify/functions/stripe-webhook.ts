import type { Handler, HandlerEvent } from "@netlify/functions";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import crypto from "crypto";
import { translations } from "../../translations"; // Correctly import from the root

// --- CONFIGURATION ---
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
  typescript: true,
});
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY!);

const LOTTERY_SECRET_KEY = process.env.LOTTERY_SECRET_KEY!;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;
const WEBSITE_URL = process.env.WEBSITE_URL! || "https://your-website.com";

// --- CONSTANTS ---
const TICKET_BUCKET = "lottery-tickets";
const DRAW_ID = 1;
const MAX_TICKET_NUMBER = 350000;
const MAX_GENERATION_ATTEMPTS = 10;
const IVORY_COLOR = "#FFFFF0";
const GOLD_COLOR = "#D4AF37";

// --- HELPER FUNCTIONS ---

/**
 * Generates a random ticket number.
 */
const generateTicketNumber = (): number => {
  return Math.floor(Math.random() * MAX_TICKET_NUMBER) + 1;
};

/**
 * Creates an HMAC signature for the ticket data.
 */
const createTicketSignature = (drawId: number, ticketNumber: number): string => {
  const hmac = crypto.createHmac("sha256", LOTTERY_SECRET_KEY);
  hmac.update(`${drawId}:${ticketNumber}`);
  return hmac.digest("hex");
};

/**
 * Generates the luxury PDF ticket using translations.
 */
const generateTicketPDF = async (
  ticketInfo: {
    ticketNumber: string;
    drawId: number;
    signature: string;
    buyerEmail?: string;
    issueDate: string;
  },
  lang: "en" | "it"
): Promise<Buffer> => {
  const t = (key: keyof typeof translations) => translations[key][lang];
  const doc = new PDFDocument({ size: "A6", margin: 30 });
  const buffers: Buffer[] = [];
  doc.on("data", buffers.push.bind(buffers));

  doc.rect(0, 0, doc.page.width, doc.page.height).fill(IVORY_COLOR);

  doc.font("Helvetica-Bold").fillColor(GOLD_COLOR).fontSize(24).text("DR7 EMPIRE", { align: "center" });
  doc.moveDown(0.5);
  doc.font("Helvetica").fillColor("#000000").fontSize(12).text(t('Lottery_Ticket_PDF_Title'), { align: "center" });

  doc.save()
     .rotate(-45, { origin: [doc.page.width / 2, doc.page.height / 2] })
     .font("Helvetica-Bold").fillColor(GOLD_COLOR).opacity(0.1).fontSize(80)
     .text("DR7", { align: "center" });
  doc.restore();

  doc.moveDown(2);
  doc.fontSize(10).fillColor("#333333").text(t('Lottery_Ticket_PDF_Your_Number'), { align: "center" });
  doc.font("Helvetica-Bold").fillColor(GOLD_COLOR).fontSize(36).text(ticketInfo.ticketNumber, { align: "center" });

  const verificationUrl = `${WEBSITE_URL}/verify?ticketNumber=${ticketInfo.ticketNumber.replace(/^0+/, '')}&drawId=${ticketInfo.drawId}&signature=${ticketInfo.signature}`;
  const qrCodeImage = await QRCode.toDataURL(verificationUrl, { errorCorrectionLevel: 'H' });
  doc.image(qrCodeImage, { fit: [80, 80], align: 'center', valign: 'center' });
  doc.moveDown(0.5);

  doc.fontSize(8).fillColor("#333333").text(`${t('Lottery_Ticket_PDF_Issue_Date')}: ${ticketInfo.issueDate}`, { align: 'left' });
  if (ticketInfo.buyerEmail) {
    doc.text(`${t('Lottery_Ticket_PDF_Customer')}: ${ticketInfo.buyerEmail}`, { align: 'left' });
  }

  const securityText = `Sig:${ticketInfo.signature.substring(0, 16)}...`;
  doc.fontSize(6).fillColor("#AAAAAA").text(securityText, doc.page.margins.left, doc.page.height - 40, { align: 'left' });
  doc.text(t('Lottery_Ticket_PDF_Scan_Verify'), { align: 'right' });

  return new Promise((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.end();
  });
};

/**
 * Generates the email HTML body using translations.
 */
const generateEmailHtml = (downloadUrl: string, lang: "en" | "it"): string => {
    const t = (key: keyof typeof translations) => translations[key][lang];
    const year = new Date().getFullYear();
    const rulesUrl = `${WEBSITE_URL}/rules`;
    const websiteUrl = WEBSITE_URL;

    return `
    <!DOCTYPE html>
    <html lang="${lang}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${t('Lottery_Email_Title')}</title>
        <style>
            body { margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; }
            .container { max-width: 600px; margin: 0 auto; background-color: #FFFFF0; color: #333333; border-radius: 8px; overflow: hidden; }
            .header { padding: 40px; text-align: center; background-color: #1a1a1a; }
            .header h1 { color: #D4AF37; margin: 0; font-size: 32px; letter-spacing: 2px; }
            .content { padding: 30px 40px; line-height: 1.6; }
            .content h2 { color: #1a1a1a; font-size: 24px; }
            .button-container { text-align: center; margin-top: 30px; }
            .button { background-color: #D4AF37; color: #FFFFFF; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block; }
            .footer { padding: 20px 40px; text-align: center; font-size: 12px; color: #888888; }
            .footer a { color: #D4AF37; text-decoration: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header"><h1>DR7 EMPIRE</h1></div>
            <div class="content">
                <h2>${t('Lottery_Email_Header')}</h2>
                <p>${t('Lottery_Email_Body_1')}</p>
                <p>${t('Lottery_Email_Body_2')}</p>
                <div class="button-container"><a href="${downloadUrl}" class="button">${t('Lottery_Email_CTA_Button')}</a></div>
                <p>${t('Lottery_Email_Good_Luck')}</p>
                <p><em>${t('Lottery_Email_Signature')}</em></p>
            </div>
            <div class="footer">
                <p>&copy; ${year} DR7 Empire. All rights reserved.</p>
                <p><a href="${rulesUrl}">${t('Lottery_Email_Footer_Rules')}</a> | <a href="${websiteUrl}">${t('Lottery_Email_Footer_Website')}</a></p>
            </div>
        </div>
    </body>
    </html>`;
};

// --- MAIN HANDLER ---

export const handler: Handler = async (event: HandlerEvent) => {
  // 1. Verify Stripe Webhook Signature
  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body!,
      event.headers["stripe-signature"]!,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook signature verification failed.`, err);
    return { statusCode: 400, body: `Webhook Error: ${(err as Error).message}` };
  }

  // 2. Handle only 'checkout.session.completed'
  if (stripeEvent.type !== "checkout.session.completed") {
    return { statusCode: 200, body: `Event type ${stripeEvent.type} not handled.` };
  }

  const session = stripeEvent.data.object as Stripe.Checkout.Session;
  const paymentIntentId = session.payment_intent as string;
  const buyerEmail = session.customer_details?.email;
  const locale = (session.metadata?.locale === 'it' ? 'it' : 'en');

  if (!buyerEmail) {
    return { statusCode: 400, body: "Buyer email is missing." };
  }

  // 3. Idempotency Check
  const { data: existingTicket } = await supabase
    .from("lottery_tickets")
    .select("id")
    .eq("payment_intent_id", paymentIntentId)
    .single();

  if (existingTicket) {
    console.log(`Payment intent ${paymentIntentId} already processed.`);
    return { statusCode: 200, body: "This payment has already been processed." };
  }

  // 4. Generate a unique ticket
  let newTicketNumber: number | null = null;
  let ticketSignature: string | null = null;

  for (let i = 0; i < MAX_GENERATION_ATTEMPTS; i++) {
    const candidateNumber = generateTicketNumber();
    const candidateSignature = createTicketSignature(DRAW_ID, candidateNumber);

    const { error } = await supabase
      .from("lottery_tickets")
      .insert({
        draw_id: DRAW_ID,
        ticket_number: candidateNumber,
        buyer_email: buyerEmail,
        payment_intent_id: paymentIntentId,
        hmac_signature: candidateSignature,
        locale: locale,
      });

    if (error) {
      if (error.code === "23505") { // Unique constraint violation
        console.warn(`Collision for ticket number ${candidateNumber}. Retrying...`);
        continue;
      }
      console.error("Failed to insert ticket into database:", error);
      return { statusCode: 500, body: "Could not create ticket in database." };
    }

    newTicketNumber = candidateNumber;
    ticketSignature = candidateSignature;
    break; // Success
  }

  if (!newTicketNumber || !ticketSignature) {
    console.error("Failed to generate a unique ticket.");
    return { statusCode: 500, body: "Could not generate a unique ticket." };
  }

  // 5. Generate and Store PDF
  const paddedTicketNumber = newTicketNumber.toString().padStart(6, "0");
  const pdfBuffer = await generateTicketPDF({
    ticketNumber: paddedTicketNumber,
    drawId: DRAW_ID,
    signature: ticketSignature,
    buyerEmail: buyerEmail,
    issueDate: new Date().toLocaleDateString(locale === 'it' ? 'it-IT' : 'en-US'),
  }, locale);

  const pdfPath = `${DRAW_ID}/${paddedTicketNumber}-${paymentIntentId}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from(TICKET_BUCKET)
    .upload(pdfPath, pdfBuffer, { contentType: "application/pdf" });

  if (uploadError) {
    console.error("Failed to upload PDF to storage:", uploadError);
    return { statusCode: 500, body: "Could not upload ticket PDF." };
  }

  // 6. Get Signed URL for Download
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(TICKET_BUCKET)
    .createSignedUrl(pdfPath, 60 * 60 * 24 * 7); // 7 days validity

  if (signedUrlError || !signedUrlData) {
    console.error("Failed to create signed URL:", signedUrlError);
    return { statusCode: 500, body: "Could not create download link." };
  }

  // 7. Send Email with Resend
  const emailHtml = generateEmailHtml(signedUrlData.signedUrl, locale);
  try {
    await resend.emails.send({
      from: "DR7 Empire <noreply@yourdomain.com>",
      to: buyerEmail,
      subject: translations['Lottery_Email_Subject'][locale],
      html: emailHtml,
    });
  } catch(emailError) {
    console.error("Failed to send email:", emailError);
  }

  // 8. Success
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, ticketNumber: paddedTicketNumber }),
  };
};