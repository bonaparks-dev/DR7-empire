# Instructions to Resend Updated Ticket PDFs

## Option 1: Via Netlify Function (After it deploys)

1. Wait for Netlify to deploy (check your Netlify dashboard)
2. Once deployed, trigger the function using curl:

```bash
curl -X POST https://YOUR-SITE.netlify.app/.netlify/functions/resend-updated-tickets \
  -H "Content-Type: application/json" \
  -d '{"secret":"DR7Empire2025"}'
```

Replace `YOUR-SITE` with your actual Netlify site URL (probably `dr7empire.netlify.app` or `dr7empire.com`)

## Option 2: Manually via Supabase + Email

Since you need this done now, here's what I recommend:

### Go to your Netlify dashboard and manually trigger the deployed function

1. Go to https://app.netlify.com
2. Find your DR7-empire site
3. Go to Functions
4. Find `resend-updated-tickets`
5. Click "Trigger function"
6. Use this payload:
```json
{"secret":"DR7Empire2025"}
```

## Option 3: Contact support to run it

Ask your Netlify support or have someone with access to the environment variables run the Node script located at:
`scripts/regenerate-and-resend-pdfs.js`

With these environment variables:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- GMAIL_USER
- GMAIL_APP_PASSWORD

## Affected Customers

The following customers will receive updated PDFs:

1. cristianosanti@inwind.it - Tickets: 0006, 0008
2. dubai.rent7.0srl@gmail.com - Tickets: 0001, 0002, 0003, 0005
3. fabriliggi@gmail.com - Ticket: 0007
4. francescola2003@gmail.com - Ticket: 0012
5. gianluca.andreolli@gmail.com - Tickets: 0009, 0010
6. infospace.magmanlacalessandro@gmail.com - Ticket: 0011
7. matteopiragavoi@gmail.com - Tickets: 0427, 0957
8. nicola.figus9@gmail.com - Ticket: 0004
9. pirafrancesco05@gmail.com - Tickets: 0681, 1545
