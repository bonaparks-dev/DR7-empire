# Google Calendar Integration Setup

This document explains how to set up Google Calendar integration for DR7 Empire car wash bookings.

## Required Environment Variables

You need to add these environment variables to your Netlify deployment:

### Method 1: Service Account (Recommended) - Used by `googleCalendar.ts`

1. **GOOGLE_SERVICE_ACCOUNT_EMAIL**
   - The email address of your Google Service Account
   - Example: `dr7-calendar@your-project.iam.gserviceaccount.com`

2. **GOOGLE_PRIVATE_KEY**
   - The private key from your service account JSON file
   - Must include the full key with `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
   - Note: Netlify will handle newlines automatically

3. **GOOGLE_CALENDAR_ID**
   - The calendar ID where events will be created
   - Default: `dubai.rent7.0srl@gmail.com`
   - Find it in Google Calendar Settings → Calendar → Integrate calendar

### Method 2: OAuth (Alternative) - Used by `create-calendar-event.ts`

1. **GOOGLE_CLIENT_ID**
2. **GOOGLE_CLIENT_SECRET**
3. **GOOGLE_REFRESH_TOKEN**
4. **GOOGLE_CALENDAR_ID**

## Setup Steps

### Option A: Service Account Setup (Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Calendar API:
   - Go to "APIs & Services" → "Enable APIs and Services"
   - Search for "Google Calendar API" and enable it
4. Create Service Account:
   - Go to "IAM & Admin" → "Service Accounts"
   - Click "Create Service Account"
   - Give it a name (e.g., "DR7 Calendar Service")
   - Grant it the "Editor" role (or create custom role)
5. Create Key:
   - Click on the service account
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Choose JSON format
   - Save the downloaded JSON file securely
6. Share Calendar with Service Account:
   - Open Google Calendar
   - Go to Settings → Select your calendar
   - Under "Share with specific people"
   - Add the service account email with "Make changes to events" permission
7. Add to Netlify:
   - Go to Netlify Dashboard → Site Settings → Environment Variables
   - Add:
     - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: Copy email from JSON
     - `GOOGLE_PRIVATE_KEY`: Copy entire `private_key` value from JSON
     - `GOOGLE_CALENDAR_ID`: Your calendar email or ID

### Option B: OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Get refresh token using OAuth Playground
4. Add credentials to Netlify environment variables

## Current Implementation

The car wash booking system:

✅ **Automatically creates Google Calendar events** when a booking is confirmed
✅ **Calculates correct duration** based on service price:
   - €25 service = 1 hour
   - €49 service = 2 hours
   - €75 service = 3 hours
   - €99 service = 4 hours

✅ **Includes comprehensive event details**:
   - Customer name and contact info
   - Service name and duration
   - Booking ID (DR7-XXXXXXXX)
   - Total price
   - Time slot blocked (e.g., "09:00 - 13:00")
   - Additional services and notes

✅ **Event format**: 🚿 LUXURY WASH (4h) - Service Name - Customer Name

✅ **Non-blocking**: If calendar creation fails, the booking still succeeds

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

## Testing

To test the integration:

1. Make a test booking through the website
2. Check Netlify function logs for calendar creation
3. Verify the event appears in Google Calendar
4. Confirm the duration matches the service price
5. Check that all booking details are included

## Support

For issues with Google Calendar integration:
- Check Netlify function logs
- Review Google Cloud Console audit logs
- Verify service account permissions
- Contact: dubai.rent7.0srl@gmail.com
