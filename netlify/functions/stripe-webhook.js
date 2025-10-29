const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const crypto = require('crypto');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const hmacSecret = process.env.HMAC_SECRET_KEY;

// Gift Card Constants
const GIFT_CARD_VALUE = 2500; // €25 in cents
const GIFT_CARD_VALIDITY_MONTHS = 24;
const GIFT_CARD_START_DATE = new Date('2025-12-26T00:00:00Z');

// Helper to create HMAC hash
const createHmac = (data) => {
  return crypto.createHmac('sha256', hmacSecret).update(JSON.stringify(data)).digest('hex');
};

// Gift Card Code Generation
const generateGiftCardCode = () => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }
  return `GIFT-${code}`;
};

const createUniqueGiftCardCode = async (maxAttempts = 10) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateGiftCardCode();
    const { data, error } = await supabase
      .from('gift_cards')
      .select('code')
      .eq('code', code)
      .maybeSingle();

    if (error) {
      console.error('[GiftCard] Error checking code uniqueness:', error);
      continue;
    }

    if (!data) return code;
  }
  throw new Error('Failed to generate unique gift card code');
};

const calculateGiftCardExpiry = (issueDate = new Date()) => {
  const expiryDate = new Date(issueDate);
  expiryDate.setMonth(expiryDate.getMonth() + GIFT_CARD_VALIDITY_MONTHS);
  return expiryDate;
};

const qualifiesForGiftCard = (ticketQuantity, purchaseDate = new Date()) => {
  if (ticketQuantity < 1) return false;
  if (purchaseDate < GIFT_CARD_START_DATE) return false;
  return true;
};

// Helper to generate PDF
const generateVoucherPDF = async (voucherData) => {
  const doc = new PDFDocument({ size: 'A6', margin: 40 });
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  // PDF Content
  doc.font('Helvetica-Bold').fontSize(20).text('DR7 Gift Card', { align: 'center' });
  doc.moveDown(0.5);
  doc.font('Helvetica').fontSize(12).text(`Value: €${voucherData.value / 100}`, { align: 'center' });

  doc.moveDown(2);
  doc.font('Helvetica-Bold').fontSize(16).text(voucherData.code, { align: 'center' });

  doc.moveDown(2);

  // QR Code Generation
  const qrPayload = JSON.stringify(voucherData);
  const qrCodeImage = await QRCode.toDataURL(qrPayload, { errorCorrectionLevel: 'H' });
  doc.image(qrCodeImage, { fit: [150, 150], align: 'center' });

  doc.moveDown(2);
  doc.fontSize(8).text(`Valid from: ${new Date(voucherData.valid_from).toLocaleDateString()}`, { align: 'left' });
  doc.fontSize(8).text(`Expires: ${new Date(voucherData.expiry).toLocaleDateString()}`, { align: 'left' });
  doc.fontSize(8).text(`Email: ${voucherData.email}`, { align: 'left' });

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.end();
  });
};

// Create and send gift card for commercial operation
const createAndSendGiftCard = async ({ email, bookingId, ticketQuantity, purchaseDate }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  try {
    console.log('[GiftCard] Creating gift card for booking:', bookingId);

    // Check if qualifies
    if (!qualifiesForGiftCard(ticketQuantity, new Date(purchaseDate))) {
      console.log('[GiftCard] Purchase does not qualify for gift card');
      return null;
    }

    // Generate unique code
    const code = await createUniqueGiftCardCode();
    const issuedAt = new Date();
    const expiresAt = calculateGiftCardExpiry(issuedAt);

    // Insert gift card into database
    const { data: giftCard, error: insertError } = await supabase
      .from('gift_cards')
      .insert({
        code,
        initial_value: GIFT_CARD_VALUE,
        remaining_value: GIFT_CARD_VALUE,
        currency: 'EUR',
        status: 'active',
        issued_with_booking_id: bookingId,
        issued_at: issuedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        recipient_name: null,
        recipient_email: email,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[GiftCard] Error inserting gift card:', insertError);
      throw insertError;
    }

    console.log('[GiftCard] Gift card created successfully:', code);

    // Send email notification
    const expiryDateFormatted = expiresAt.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    await transporter.sendMail({
      from: `"DR7 Empire" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '🎁 Il tuo Regalo DR7 – Gift Card da €25 / Your DR7 Gift – €25 Gift Card',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #000000 0%, #434343 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .gift-card { background: white; border: 2px solid #000; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
            .code { font-size: 28px; font-weight: bold; color: #000; letter-spacing: 2px; margin: 20px 0; }
            .value { font-size: 36px; font-weight: bold; color: #000; margin: 10px 0; }
            .info { background: #fff; border-left: 4px solid #000; padding: 15px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            .lang-separator { border-top: 2px dashed #ccc; margin: 30px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎁 GRAZIE PER IL TUO ACQUISTO!</h1>
              <h2>THANK YOU FOR YOUR PURCHASE!</h2>
            </div>
            <div class="content">
              <!-- Italian Version -->
              <h2>🇮🇹 La tua Gift Card è pronta!</h2>
              <p>Come ringraziamento per il tuo acquisto, ti regaliamo una Gift Card del valore di <strong>€25</strong>!</p>

              <div class="gift-card">
                <div class="value">€25</div>
                <p style="margin: 10px 0; color: #666;">Codice Gift Card:</p>
                <div class="code">${code}</div>
              </div>

              <div class="info">
                <p><strong>📅 Validità:</strong> fino al ${expiryDateFormatted} (24 mesi)</p>
                <p><strong>🎫 Come utilizzarla:</strong> Inserisci il codice al momento del pagamento per il tuo prossimo servizio (car wash o noleggio auto)</p>
                <p><strong>⚠️ Importante:</strong> Non cumulabile con altre gift card. Una sola gift card per transazione.</p>
              </div>

              <div class="lang-separator"></div>

              <!-- English Version -->
              <h2>🇬🇧 Your Gift Card is ready!</h2>
              <p>As a thank you for your purchase, we're gifting you a Gift Card worth <strong>€25</strong>!</p>

              <div class="gift-card">
                <div class="value">€25</div>
                <p style="margin: 10px 0; color: #666;">Gift Card Code:</p>
                <div class="code">${code}</div>
              </div>

              <div class="info">
                <p><strong>📅 Valid until:</strong> ${expiryDateFormatted} (24 months)</p>
                <p><strong>🎫 How to use:</strong> Enter the code at checkout for your next service (car wash or car rental)</p>
                <p><strong>⚠️ Important:</strong> Non-cumulative with other gift cards. Only one gift card per transaction.</p>
              </div>

              <div class="footer">
                <p>DR7 Empire – Luxury Car Rental & Services</p>
                <p>Dubai Rent 7.0 SRL</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log('[GiftCard] Email sent successfully to:', email);
    return giftCard;

  } catch (error) {
    console.error('[GiftCard] Error in createAndSendGiftCard:', error);
    throw error;
  }
};

// Core logic for creating and sending a voucher
const createAndSendVoucher = async ({ email, paid_cents, stripe_object_id, value_cents }) => {
  // Set up Nodemailer with Gmail
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  try {
    // 1. Prepare Voucher Data
    const voucherDetails = {
      email,
      value_cents: value_cents || 2500, // Default to 25 EUR
      paid_cents,
      valid_from: new Date('2025-12-26T00:00:00Z').toISOString(),
      expiry: new Date('2026-12-31T23:59:59Z').toISOString(),
      stripe_session_id: stripe_object_id, // Can be a payment intent ID or session ID
      status: 'valid'
    };

    // 2. Create HMAC hash (without the code first)
    const hmac_hash_placeholder = createHmac({ ...voucherDetails, code: "TBD" });

    // 3. Insert into Supabase (code is generated by trigger)
    const { data: newVoucher, error: insertError } = await supabase
      .from('vouchers')
      .insert({ ...voucherDetails, hmac_hash: hmac_hash_placeholder })
      .select()
      .single();

    if (insertError) throw insertError;

    // 4. Create final QR payload with the real code and hash
    const finalPayload = {
      code: newVoucher.code,
      email: newVoucher.email,
      value: newVoucher.value_cents,
      paid: newVoucher.paid_cents,
      valid_from: newVoucher.valid_from,
      expiry: newVoucher.expiry
    };
    const finalHash = createHmac(finalPayload);

    // 5. Update voucher with the final hash
    const { error: updateError } = await supabase
      .from('vouchers')
      .update({ hmac_hash: finalHash })
      .eq('id', newVoucher.id);

    if (updateError) throw updateError;

    newVoucher.hmac_hash = finalHash;

    // 6. Generate PDF
    const qrDataForPDF = { ...finalPayload, hash: finalHash };
    const pdfBuffer = await generateVoucherPDF(qrDataForPDF);
    const pdfPath = `${newVoucher.code}.pdf`;

    // 7. Upload PDF to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('vouchers')
      .upload(pdfPath, pdfBuffer, { contentType: 'application/pdf', upsert: true });

    if (uploadError) throw uploadError;

    // 8. Update voucher with pdf_path
    await supabase.from('vouchers').update({ pdf_path: pdfPath }).eq('id', newVoucher.id);

    // 9. Send Email with Nodemailer
    await transporter.sendMail({
      from: `"DR7 Empire" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Your DR7 Gift Card – €25 value',
      html: `<h1>Thank you for your purchase!</h1>
             <p>Here is your gift card code: <strong>${newVoucher.code}</strong></p>
             <p>Value: €25</p>
             <p>Valid from: 26/12/2025 to 31/12/2026</p>
             <p>Your voucher is attached to this email as a PDF.</p>`,
      attachments: [
        {
          filename: `${newVoucher.code}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

  } catch (error) {
    console.error('Error in createAndSendVoucher:', error);
    throw error; // Re-throw to be caught by the main handler
  }
};


exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed.`, err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object;
        await createAndSendVoucher({
            email: session.customer_email,
            paid_cents: session.amount_total,
            stripe_object_id: session.id,
            value_cents: parseInt(session.metadata.value, 10) * 100 || 2500
        });
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = stripeEvent.data.object;

        // Handle old voucher system
        if (paymentIntent.metadata.generateVoucher === 'true') {
          await createAndSendVoucher({
              email: paymentIntent.metadata.email,
              paid_cents: paymentIntent.amount,
              stripe_object_id: paymentIntent.id,
              value_cents: parseInt(paymentIntent.metadata.voucherValue, 10) || 2500
          });
        }

        // Send WhatsApp notification for ticket purchases
        if (paymentIntent.metadata.purchaseType === 'commercial-operation-ticket') {
          console.log('[Ticket] Commercial operation payment detected');

          const ticketQuantity = Math.floor(paymentIntent.amount / 2000);

          try {
            await fetch(`${process.env.URL}/.netlify/functions/send-whatsapp-notification`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'ticket',
                ticket: {
                  customer_name: paymentIntent.metadata.name || 'Cliente',
                  customer_email: paymentIntent.metadata.email,
                  quantity: ticketQuantity,
                  total_price: paymentIntent.amount,
                  ticket_numbers: paymentIntent.metadata.ticketNumbers ? JSON.parse(paymentIntent.metadata.ticketNumbers) : []
                }
              })
            });
            console.log('[Ticket] WhatsApp notification sent');
          } catch (error) {
            console.error('[Ticket] Failed to send WhatsApp notification:', error);
          }
        }

        // Gift card system for commercial operation is disabled
        // Keeping this commented for future reference
        /*
        if (paymentIntent.metadata.purchaseType === 'commercial-operation-ticket') {
          console.log('[GiftCard] Commercial operation payment detected');

          const ticketQuantity = Math.floor(paymentIntent.amount / 2000);
          const bookingId = paymentIntent.metadata.bookingId || null;

          try {
            await createAndSendGiftCard({
              email: paymentIntent.metadata.email,
              bookingId: bookingId,
              ticketQuantity: ticketQuantity,
              purchaseDate: new Date().toISOString()
            });
          } catch (error) {
            console.error('[GiftCard] Failed to create gift card, but payment succeeded:', error);
          }
        }
        */
        break;
      }

      default:
        console.log(`Unhandled event type ${stripeEvent.type}`);
    }
  } catch (error) {
      console.error('Error processing webhook event:', error);
      return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};