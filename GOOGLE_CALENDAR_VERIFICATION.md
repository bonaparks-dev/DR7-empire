# Google Calendar OAuth Verification Guide

This guide explains how to verify that Google Calendar is properly set up with OAuth and refresh tokens.

## Quick Verification

### Method 1: Using the Test Endpoint (Recommended)

After deploying to Netlify, visit this URL:

```
https://your-site.netlify.app/.netlify/functions/test-google-calendar
```

**What it checks:**
1. ✅ All required environment variables are present
2. ✅ OAuth refresh token is valid and can generate access tokens
3. ✅ Google Calendar API is accessible
4. ✅ Target calendar exists and has proper permissions

**Expected Response:**
```json
{
  "success": true,
  "message": "Google Calendar OAuth is properly configured and working!",
  "timestamp": "2025-10-14T...",
  "configurationCheck": {
    "status": "PASSED",
    "hasClientId": true,
    "hasClientSecret": true,
    "hasRefreshToken": true,
    "calendarId": "dubai.rent7.0srl@gmail.com"
  },
  "connectionTest": {
    "status": "PASSED",
    "tokenType": "Bearer",
    "hasAccessToken": true,
    "expiryDate": "2025-10-14T..."
  },
  "calendarAccessTest": {
    "status": "PASSED",
    "totalCalendars": 3,
    "targetCalendarFound": true,
    "targetCalendarId": "dubai.rent7.0srl@gmail.com"
  }
}
```

### Method 2: Check Netlify Function Logs

1. Go to Netlify Dashboard → Functions
2. Look for `send-booking-confirmation` function
3. Check logs for calendar-related messages:
   - `✅ Calendar event created successfully!`
   - `🆔 Event ID: ...`
   - `🔗 Event link: ...`

### Method 3: Make a Test Booking

1. Create a test car wash booking on your site
2. Check your Google Calendar for the new event
3. Verify the event details are correct
4. Check Netlify function logs for calendar creation messages

## Required Environment Variables

Ensure these are set in Netlify (Site Settings → Environment Variables):

```bash
GOOGLE_CLIENT_ID="your_oauth_client_id"
GOOGLE_CLIENT_SECRET="your_oauth_client_secret"
GOOGLE_REFRESH_TOKEN="your_refresh_token"
GOOGLE_CALENDAR_ID="dubai.rent7.0srl@gmail.com"  # Optional, this is default
```

## How OAuth Refresh Tokens Work

### What is a Refresh Token?

A **refresh token** is a long-lived credential that allows the application to automatically obtain new access tokens without user interaction.

- **Access Token**: Short-lived (usually 1 hour), used to make API calls
- **Refresh Token**: Long-lived (can last indefinitely), used to get new access tokens

### The Flow:

```
1. Initial OAuth Setup (one-time)
   User authorizes → Google returns refresh token → Store in Netlify env vars

2. Every Booking (automatic)
   App uses refresh token → Gets new access token → Creates calendar event

3. Token Refresh (automatic)
   Access token expires → googleapis library auto-refreshes → Gets new access token
```

### Why This is Better Than Service Account:

✅ **User-based access**: Events appear as created by your Google account
✅ **Email invites**: Can send calendar invites to customers (service accounts can't)
✅ **No JSON key file**: More secure, no private keys in code
✅ **Standard OAuth**: Industry standard authentication method

## Current Implementation Details

### OAuth Configuration (`googleCalendar.ts`)

```typescript
const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  'http://localhost' // redirect URI (not used for refresh token flow)
);

oauth2Client.setCredentials({
  refresh_token: refreshToken,
});
```

### Automatic Token Refresh

The Google APIs client library automatically handles token refresh:
- When an access token expires, it uses the refresh token to get a new one
- No manual token management needed
- Refresh happens transparently in the background

### Event Creation Flow

```
1. Customer completes booking
2. Stripe payment succeeds
3. Booking saved to Supabase
4. send-booking-confirmation function triggered
5. Email sent to customer and admin
6. createCalendarEvent called with OAuth
7. Google Calendar event created
8. WhatsApp notification sent
```

## Troubleshooting

### Error: "Refresh token may be expired or invalid"

**Solution:**
1. Generate a new refresh token using `get-refresh-token.js` or OAuth Playground
2. Update `GOOGLE_REFRESH_TOKEN` in Netlify environment variables
3. Redeploy the site

### Error: "Calendar not found"

**Solution:**
1. Verify `GOOGLE_CALENDAR_ID` matches your actual calendar ID
2. Find it in Google Calendar Settings → Calendar → Integrate calendar
3. Default is `dubai.rent7.0srl@gmail.com`

### Error: "Permission denied"

**Solution:**
1. Make sure you used the correct Google account when generating the refresh token
2. The account must have access to the calendar specified in `GOOGLE_CALENDAR_ID`
3. If using a shared calendar, ensure the OAuth account has "Make changes to events" permission

### Events not appearing in calendar

**Check these:**
1. Run the test endpoint to verify OAuth is working
2. Check Netlify function logs for errors
3. Verify the calendar ID is correct
4. Ensure refresh token hasn't expired
5. Check that Google Calendar API is enabled in Google Cloud Console

## Refresh Token Best Practices

### Security

✅ **Store in environment variables**: Never commit refresh tokens to git
✅ **Use Netlify environment variables**: Encrypted at rest
✅ **Limit scope**: Only request `https://www.googleapis.com/auth/calendar` scope

### Longevity

- Refresh tokens don't expire unless:
  - User revokes access
  - 6 months of inactivity (for unverified apps)
  - You generate too many tokens (100+ per user)

- To prevent expiration:
  - Keep the app verified in Google Cloud Console
  - Regular bookings will keep it active
  - Monitor for errors and regenerate if needed

## Monitoring

### What to Monitor:

1. **Function Logs**: Check for calendar creation success/failure
2. **Error Rate**: Track how many bookings fail to create calendar events
3. **Token Expiry**: Set up alerts for authentication errors

### Netlify Function Logs to Look For:

**Success:**
```
✅ Calendar event created successfully!
🆔 Event ID: abc123xyz
🔗 Event link: https://calendar.google.com/...
```

**Errors:**
```
❌ Error creating calendar event: invalid_grant
⚠️ Authentication error: Refresh token may be expired or invalid
```

## Support

For issues with Google Calendar integration:
1. Check Netlify function logs
2. Run the test endpoint
3. Review Google Cloud Console audit logs
4. Verify OAuth credentials are current

Contact: dubai.rent7.0srl@gmail.com
