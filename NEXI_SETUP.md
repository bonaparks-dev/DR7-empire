# Nexi Payment Integration - Environment Variables

Copy these variables to your `.env` file and Netlify environment variables:

```bash
# Nexi XPay Payment Gateway Configuration
NEXI_ALIAS=payment_3892082
NEXI_MAC_KEY=O1c57OA4aH7o434dH79KCK7IFoh7g0KZ869K1OMt
NEXI_MERCHANT_ID=03892082
NEXI_TERMINAL_ID=03892082
NEXI_CODICE_PUNTO_VENDITA=001859607

# API Key (use this one provided by user)
NEXI_API_KEY=16681422

# Environment (sandbox for testing, production for live)
NEXI_ENVIRONMENT=sandbox

# API Base URLs
NEXI_API_BASE_URL_SANDBOX=https://xpaysandboxdb.nexigroup.com
NEXI_API_BASE_URL_PRODUCTION=https://xpay.nexigroup.com

# Token Requestor IDs (for Apple Pay / Google Pay future integration)
NEXI_TOKEN_REQUESTOR_ID_VTSM=40060519423
NEXI_TOKEN_REQUESTOR_ID_MDES=50150403604

# Your site URL (for callbacks)
URL=https://dr7empire.com
```

## Setup Instructions

### 1. Local Development (.env file)
Create or update your `.env` file in the project root with the above variables.

### 2. Netlify Environment Variables
Add these variables in Netlify Dashboard:
1. Go to your site settings
2. Navigate to "Environment variables"
3. Add each variable listed above

### 3. Database Migration
Run the SQL migration to add Nexi fields to your database:

```bash
# Execute in Supabase SQL Editor
supabase/migrations/20251207000000_add_nexi_payment_fields.sql
```

Or run directly in Supabase Dashboard > SQL Editor.

### 4. Test in Sandbox
1. Set `NEXI_ENVIRONMENT=sandbox`
2. Use Nexi test cards for testing
3. Monitor webhook calls in Netlify Functions logs

### 5. Go Live
1. Change `NEXI_ENVIRONMENT=production`
2. Verify all environment variables are set in Netlify
3. Test with a small real transaction
4. Monitor first few transactions closely

## Nexi Webhook Configuration

Configure this webhook URL in your Nexi dashboard:
```
https://dr7empire.com/.netlify/functions/nexi-webhook
```

## Testing

### Test Cards (Sandbox)
- **Success**: 4539970000000006
- **Failure**: 4539970000000014
- **3D Secure**: 4539970000000022

### Verify Payment Flow
1. Visit `/commercial-operation`
2. Select tickets
3. Complete payment in Nexi iframe
4. Verify redirect to success page
5. Check database for payment record
6. Confirm email receipt
