# URGENT: Fix Netlify to Use OAuth (Not Service Account)

## Problem

Netlify is using OLD service account code instead of OAuth. Error:
```
Service accounts cannot invite attendees without Domain-Wide Delegation of Authority
```

## Solution: Clean Setup

### Step 1: Clear Old Environment Variables in Netlify

1. Go to: **Netlify Dashboard** → Your Site → **Site settings** → **Environment variables**

2. **DELETE these OLD service account variables** (if they exist):
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`

3. Click **Save** after deleting

### Step 2: Add OAuth Environment Variables

In the same Environment variables section, **ADD these variables**:

```bash
GOOGLE_CLIENT_ID=your_oauth_client_id
GOOGLE_CLIENT_SECRET=your_oauth_client_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token
GOOGLE_CALENDAR_ID=dubai.rent7.0srl@gmail.com
```

**Important:** Use the OAuth credentials, NOT service account credentials!

### Step 3: Get OAuth Credentials

If you don't have OAuth credentials yet:

1. **Get refresh token** using one of these files in your project:
   - `get-refresh-token.js`
   - `get-oauth-token-final.html`

2. Or use [Google OAuth Playground](https://developers.google.com/oauthplayground/)
   - Select scope: `https://www.googleapis.com/auth/calendar`
   - Authorize and get the refresh token

### Step 4: Clear Netlify Build Cache

1. Go to: **Netlify Dashboard** → Your Site → **Deploys**
2. Click **Trigger deploy** → **Clear cache and deploy site**

This ensures Netlify rebuilds with the NEW code.

### Step 5: Verify the Fix

After deployment completes:

1. **Check function logs:**
   - Go to: **Netlify Dashboard** → Functions → `send-booking-confirmation`
   - Look for: `Using OAuth2 authentication for Google Calendar` ✅
   - Should NOT see: `Using Service Account authentication` ❌

2. **Test the endpoint:**
   - Visit: `https://your-site.netlify.app/.netlify/functions/test-google-calendar`
   - Should return: `"success": true`

3. **Make a test booking:**
   - Create a car wash booking
   - Check calendar event is created
   - Check Netlify logs show: `✅ Calendar event created successfully!`

## Why This Happened

1. Old code had service account fallback
2. Netlify cached the old build
3. Old environment variables (service account) still existed
4. Netlify used old cached code instead of new OAuth-only code

## Current Code (Correct)

The current `googleCalendar.ts` ONLY uses OAuth:

```typescript
const getCalendarClient = () => {
  // Use OAuth2 authentication only
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Calendar OAuth credentials not configured');
  }

  console.log('Using OAuth2 authentication for Google Calendar');
  // ... OAuth setup
};
```

## Troubleshooting

### Still seeing "Service Account" in logs?

**Solution:**
1. Double-check you deleted `GOOGLE_PRIVATE_KEY` and `GOOGLE_SERVICE_ACCOUNT_EMAIL` from Netlify
2. Clear cache and redeploy
3. Check the latest git commit is deployed

### Error: "OAuth credentials not configured"?

**Solution:**
1. Verify OAuth variables are set in Netlify:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REFRESH_TOKEN`
2. Check for typos in variable names
3. Redeploy after adding variables

### Error: "invalid_grant" or "Token expired"?

**Solution:**
1. Generate a new refresh token
2. Update `GOOGLE_REFRESH_TOKEN` in Netlify
3. Redeploy

## Checklist

Use this checklist to ensure proper setup:

- [ ] Deleted `GOOGLE_SERVICE_ACCOUNT_EMAIL` from Netlify
- [ ] Deleted `GOOGLE_PRIVATE_KEY` from Netlify
- [ ] Added `GOOGLE_CLIENT_ID` to Netlify
- [ ] Added `GOOGLE_CLIENT_SECRET` to Netlify
- [ ] Added `GOOGLE_REFRESH_TOKEN` to Netlify
- [ ] Added `GOOGLE_CALENDAR_ID` to Netlify (optional)
- [ ] Cleared Netlify build cache
- [ ] Triggered new deployment
- [ ] Verified logs show "OAuth2 authentication"
- [ ] Tested booking creates calendar event
- [ ] Test endpoint returns success

## Support

If you still have issues after following these steps:
1. Check Netlify function logs for specific errors
2. Run test endpoint: `/.netlify/functions/test-google-calendar`
3. Contact: dubai.rent7.0srl@gmail.com
