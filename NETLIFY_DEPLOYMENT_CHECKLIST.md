# Netlify Deployment Checklist

## Before Every Deployment

### 1. Environment Variables Check

Go to: **Netlify Dashboard → Site Settings → Environment Variables**

**Required variables:**

```bash
# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Gmail
GMAIL_USER=dubai.rent7.0srl@gmail.com
GMAIL_APP_PASSWORD=your_app_password

# Google Calendar - OAuth (NOT Service Account!)
GOOGLE_CLIENT_ID=your_oauth_client_id
GOOGLE_CLIENT_SECRET=your_oauth_client_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token
GOOGLE_CALENDAR_ID=dubai.rent7.0srl@gmail.com

# WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Google Places
VITE_GOOGLE_PLACES_API_KEY=your_places_api_key
VITE_GOOGLE_PLACE_ID=your_place_id
```

**❌ DO NOT SET THESE (Service Account - Deprecated):**
- ~~GOOGLE_SERVICE_ACCOUNT_EMAIL~~
- ~~GOOGLE_PRIVATE_KEY~~

### 2. Clear Cache When:

Clear cache and redeploy when:
- ✅ Changing authentication methods
- ✅ After updating Netlify function code
- ✅ Seeing old code behavior in production
- ✅ Environment variables were changed

**How to clear cache:**
1. Netlify Dashboard → Deploys
2. Trigger deploy → **Clear cache and deploy site**

### 3. Verify Deployment

After each deployment:

1. **Check build log** for errors
2. **Test critical functions:**
   - Booking creation
   - Email sending
   - Calendar event creation
   - WhatsApp notifications
3. **Run test endpoint:**
   ```
   https://your-site.netlify.app/.netlify/functions/test-google-calendar
   ```

### 4. Monitor Function Logs

Check logs for first few bookings:
1. Netlify Dashboard → Functions
2. Click on `send-booking-confirmation`
3. Look for:
   - ✅ `Using OAuth2 authentication for Google Calendar`
   - ✅ `✅ Calendar event created successfully!`
   - ✅ `✅ Customer email sent successfully`
   - ❌ No authentication errors

## Common Issues

### Issue: "Service accounts cannot invite attendees"

**Cause:** Old service account variables still set
**Fix:**
1. Delete `GOOGLE_PRIVATE_KEY` and `GOOGLE_SERVICE_ACCOUNT_EMAIL`
2. Ensure OAuth variables are set
3. Clear cache and redeploy

### Issue: "OAuth credentials not configured"

**Cause:** OAuth variables not set in Netlify
**Fix:**
1. Add all 3 OAuth variables (CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN)
2. Redeploy

### Issue: Old code still running

**Cause:** Netlify build cache
**Fix:** Clear cache and deploy site

### Issue: Refresh token expired

**Cause:** Token revoked or expired
**Fix:**
1. Generate new refresh token
2. Update `GOOGLE_REFRESH_TOKEN` in Netlify
3. Redeploy

## Production Monitoring

### Daily Checks:
- [ ] Check for failed bookings
- [ ] Verify calendar events are being created
- [ ] Check email delivery
- [ ] Monitor Netlify function errors

### Weekly Checks:
- [ ] Review Netlify function logs
- [ ] Check Google Calendar API usage
- [ ] Verify OAuth token is still valid
- [ ] Test booking flow end-to-end

### Monthly Checks:
- [ ] Review all environment variables
- [ ] Test all booking types (car, car wash)
- [ ] Verify payment processing
- [ ] Check email templates
