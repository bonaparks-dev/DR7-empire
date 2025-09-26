<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Sz6BUcvxAu4pkNndwXOgBnqGS1sw3W94

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

---

## Digital Voucher System Setup

This section details the setup for the automated digital voucher/gift card system, which is integrated into the lottery ticket purchase flow. When a user purchases a 20€ lottery ticket, a 25€ voucher is automatically generated and emailed to them.

### 1. Environment Variables

Create a `.env` file in the root of the project and add the following variables. For Netlify, these should be set in the site's build & deploy environment settings.

```
# Stripe - (Use test keys for development)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Gmail (Nodemailer)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-google-app-password

# Security
HMAC_SECRET_KEY=a-very-strong-and-random-secret-key
ADMIN_PIN=a-secure-4-to-8-digit-pin-for-redemption
```

### 2. Supabase Setup

1.  **Run Migrations**: Apply the database schema by running the migrations located in the `supabase/migrations` directory. If you are using the Supabase CLI, you can push the schema changes with `supabase db push`.
2.  **Create Storage Bucket**:
    *   Go to your Supabase project dashboard.
    *   Navigate to the "Storage" section.
    *   Click "Create a new bucket".
    *   Name the bucket **`vouchers`**.
    *   Ensure the bucket is **not** set to public. The system uses signed URLs for secure, time-limited access.

### 3. Stripe Setup

1.  **API Keys**: Get your "Secret key" from the Stripe Dashboard under **Developers > API keys**.
2.  **Webhook Endpoint**:
    *   Go to **Developers > Webhooks**.
    *   Click "**Add an endpoint**".
    *   The endpoint URL should be `https://<YOUR_NETLIFY_SITE_URL>/.netlify/functions/stripe-webhook`.
    *   For local testing, you can use the Stripe CLI to forward events: `stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook`.
    *   Select the events to listen to:
        - **`payment_intent.succeeded`** (for the integrated lottery ticket flow)
        - **`checkout.session.completed`** (if you use Stripe Checkout elsewhere)
    *   After creating the endpoint, copy the **Signing secret** and set it as your `STRIPE_WEBHOOK_SECRET` environment variable.

### 4. Gmail (Nodemailer) Setup

To send voucher emails via your Gmail account, you need to configure it securely.

1.  **Enable 2-Step Verification**: Your Google Account must have 2-Step Verification enabled. You can check this at [myaccount.google.com/security](https://myaccount.google.com/security).
2.  **Generate an App Password**:
    *   Go to the [App Passwords page](https://myaccount.google.com/apppasswords) in your Google Account settings.
    *   If prompted, sign in again.
    *   At the bottom, click **Select app** and choose **Other (Custom name)**.
    *   Name it something descriptive, like `DR7 Empire Vouchers`, and click **GENERATE**.
    *   Google will generate a 16-character password. **Copy this password immediately**, as you won't be able to see it again.
3.  **Set Environment Variables**:
    *   Set `GMAIL_USER` to your full Gmail address (e.g., `your-name@gmail.com`).
    *   Set `GMAIL_APP_PASSWORD` to the 16-character App Password you just generated (without spaces).
