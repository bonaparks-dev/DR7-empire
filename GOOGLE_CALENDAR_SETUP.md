# Google Calendar Integration Setup

This document explains how to set up Google Calendar integration for DR7 Empire car and car wash bookings.

## Required Environment Variables

You need to add these environment variables to your Netlify deployment:

### OAuth 2.0 Authentication (Current Implementation)

The application uses **OAuth 2.0** authentication for Google Calendar integration. This method is configured in `googleCalendar.ts`.

Required variables:

1. **GOOGLE_CLIENT_ID**
   - Your OAuth 2.0 Client ID from Google Cloud Console

2. **GOOGLE_CLIENT_SECRET**
   - Your OAuth 2.0 Client Secret from Google Cloud Console

3. **GOOGLE_REFRESH_TOKEN**
   - A refresh token generated for your Google account

4. **GOOGLE_CALENDAR_ID** (optional)
   - The calendar ID where events will be created
   - Default: `dubai.rent7.0srl@gmail.com`
   - Find it in Google Calendar Settings → Calendar → Integrate calendar

## Setup Steps

### OAuth 2.0 Setup (Current Implementation)

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Google Calendar API**
   - Go to "APIs & Services" → "Enable APIs and Services"
   - Search for "Google Calendar API"
   - Click "Enable"

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth Client ID"
   - Choose application type: "Web application"
   - Add authorized redirect URI: `http://localhost` (for getting refresh token)
   - Save and note down your Client ID and Client Secret

4. **Get Refresh Token**
   - Use one of the helper files in the project (`get-refresh-token.js`, `get-oauth-token-final.html`)
   - Or use [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
   - Select "Google Calendar API v3" scope: `https://www.googleapis.com/auth/calendar`
   - Authorize and exchange authorization code for tokens
   - Save the refresh token securely

5. **Add to Netlify Environment Variables**
   - Go to Netlify Dashboard → Site Settings → Environment Variables
   - Add:
     - `GOOGLE_CLIENT_ID`: Your OAuth Client ID
     - `GOOGLE_CLIENT_SECRET`: Your OAuth Client Secret
     - `GOOGLE_REFRESH_TOKEN`: Your refresh token
     - `GOOGLE_CALENDAR_ID`: Your calendar email (optional, defaults to dubai.rent7.0srl@gmail.com)

## Current Implementation

The booking system automatically creates Google Calendar events for both car rentals and car washes:

### Car Rental Events

✅ **Event format**: 🚙 CAR RENTAL - Vehicle Name - Customer Name
✅ **Includes**:
   - Customer name and contact info
   - Vehicle name and type
   - Pickup/dropoff dates and locations
   - Booking ID (DR7-XXXXXXXX)
   - Total price and payment status
   - Insurance details

### Car Wash Events

✅ **Event format**: 🚿 LUXURY WASH (4h) - Service Name - Customer Name
✅ **Calculates correct duration** based on service price:
   - €25 service = 1 hour
   - €49 service = 2 hours
   - €75 service = 3 hours
   - €99 service = 4 hours

✅ **Includes**:
   - Customer name and contact info
   - Service name and duration
   - Booking ID (DR7-XXXXXXXX)
   - Total price
   - Time slot blocked (e.g., "09:00 - 13:00")
   - Additional services and notes

### General Features

✅ **OAuth 2.0 Authentication**: Secure, user-authorized access
✅ **Email Notifications**: Can send invites to customers (OAuth supports this)
✅ **Non-blocking**: If calendar creation fails, the booking still succeeds
✅ **Automatic Reminders**: 1 day and 1 hour before the event

## How It Works

1. Customer completes booking on website
2. Payment is processed via Stripe
3. Booking is saved to Supabase database
4. Email confirmation is sent to customer and admin
5. Google Calendar event is created automatically
6. WhatsApp notification is sent (optional)

## Files Involved

- `/netlify/functions/utils/googleCalendar.ts` - Main calendar integration logic
- `/netlify/functions/send-booking-confirmation.ts` - Calls calendar integration after booking
- `/netlify/functions/create-calendar-event.ts` - Alternative OAuth implementation

## Troubleshooting

### Error: "Google Calendar credentials not configured"
- Check that environment variables are set in Netlify
- Verify the service account email and private key are correct

### Error: "Failed to create calendar event"
- Ensure the service account has access to the calendar
- Check that Google Calendar API is enabled
- Verify the calendar ID is correct

### Events not appearing in calendar
- Check the calendar ID matches the one shared with service account
- Look for errors in Netlify function logs
- Verify service account permissions

### Booking conflict detection
- The frontend queries Supabase for existing bookings
- It filters available time slots based on:
  - Service duration
  - Existing bookings on the selected date
  - Valid time windows (9:00-12:00, 15:00-18:00)
- Calendar events are informational only; conflicts are prevented at booking time

## Testing & Verification

### Quick Test (Recommended)

After deploying, visit the test endpoint:
```
https://your-site.netlify.app/.netlify/functions/test-google-calendar
```

This will verify:
- ✅ OAuth credentials are configured
- ✅ Refresh token is valid
- ✅ Calendar API is accessible
- ✅ Target calendar has proper permissions

### Manual Testing

1. Make a test booking through the website
2. Check Netlify function logs for calendar creation
3. Verify the event appears in Google Calendar
4. Confirm the duration matches the service price
5. Check that all booking details are included

For detailed verification steps and troubleshooting, see [GOOGLE_CALENDAR_VERIFICATION.md](./GOOGLE_CALENDAR_VERIFICATION.md)

## Support

For issues with Google Calendar integration:
- Check Netlify function logs
- Run the test endpoint: `/.netlify/functions/test-google-calendar`
- Review Google Cloud Console audit logs
- Verify OAuth credentials are current
- Contact: dubai.rent7.0srl@gmail.com
