import type { Handler } from "@netlify/functions";
import { google } from 'googleapis';

/**
 * Test endpoint to verify Google Calendar OAuth connection
 * Access at: /.netlify/functions/test-google-calendar
 */
const handler: Handler = async (event) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  const results = {
    timestamp: new Date().toISOString(),
    configurationCheck: {} as any,
    connectionTest: {} as any,
    calendarAccessTest: {} as any,
  };

  try {
    // Step 1: Check if all required environment variables are present
    console.log('📋 Checking environment variables...');
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'dubai.rent7.0srl@gmail.com';

    results.configurationCheck = {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasRefreshToken: !!refreshToken,
      calendarId: calendarId,
      clientIdPreview: clientId ? `${clientId.substring(0, 20)}...` : 'NOT SET',
    };

    if (!clientId || !clientSecret || !refreshToken) {
      results.configurationCheck.status = 'FAILED';
      results.configurationCheck.error = 'Missing required OAuth credentials';
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(results, null, 2),
      };
    }

    results.configurationCheck.status = 'PASSED';
    console.log('✅ All environment variables present');

    // Step 2: Test OAuth2 client creation and token refresh
    console.log('🔐 Testing OAuth2 client...');
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'http://localhost'
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    // Try to get access token (this will test if refresh token works)
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      results.connectionTest = {
        status: 'PASSED',
        tokenType: credentials.token_type,
        hasAccessToken: !!credentials.access_token,
        expiryDate: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
      };
      console.log('✅ OAuth2 client working, access token obtained');
    } catch (tokenError: any) {
      results.connectionTest = {
        status: 'FAILED',
        error: tokenError.message,
        details: 'Refresh token may be expired or invalid',
      };
      console.error('❌ Failed to refresh access token:', tokenError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(results, null, 2),
      };
    }

    // Step 3: Test calendar access by listing calendars
    console.log('📅 Testing calendar access...');
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
      const calendarListResponse = await calendar.calendarList.list();
      const calendars = calendarListResponse.data.items || [];

      const targetCalendar = calendars.find(cal => cal.id === calendarId);

      results.calendarAccessTest = {
        status: 'PASSED',
        totalCalendars: calendars.length,
        targetCalendarFound: !!targetCalendar,
        targetCalendarId: calendarId,
        availableCalendars: calendars.map(cal => ({
          id: cal.id,
          summary: cal.summary,
          primary: cal.primary,
          accessRole: cal.accessRole,
        })),
      };

      if (!targetCalendar) {
        results.calendarAccessTest.warning = `Target calendar "${calendarId}" not found in accessible calendars`;
        console.warn(`⚠️ Target calendar "${calendarId}" not found`);
      } else {
        console.log(`✅ Target calendar found with access role: ${targetCalendar.accessRole}`);
      }

    } catch (calendarError: any) {
      results.calendarAccessTest = {
        status: 'FAILED',
        error: calendarError.message,
        details: 'Failed to access Google Calendar API',
      };
      console.error('❌ Failed to access calendar:', calendarError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(results, null, 2),
      };
    }

    // All tests passed!
    console.log('✅ All tests passed!');
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Google Calendar OAuth is properly configured and working!',
        ...results,
      }, null, 2),
    };

  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        message: 'Unexpected error during calendar verification',
        error: error.message,
        stack: error.stack,
        ...results,
      }, null, 2),
    };
  }
};

export { handler };
