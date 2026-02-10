import type { Handler } from "@netlify/functions";
import { google } from 'googleapis';

/**
 * Test Google Calendar OAuth setup
 * Call: /.netlify/functions/test-calendar-oauth
 */
const handler: Handler = async () => {
  console.log('Testing Google Calendar OAuth Setup...');

  // Check environment variables
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  const results = {
    environmentVariables: {
      GOOGLE_CLIENT_ID: clientId ? 'Set' : 'Missing',
      GOOGLE_CLIENT_SECRET: clientSecret ? 'Set' : 'Missing',
      GOOGLE_REFRESH_TOKEN: refreshToken ? 'Set' : 'Missing',
      GOOGLE_CALENDAR_ID: calendarId ? 'Set' : 'Missing',
    },
    values: {
      clientIdPrefix: clientId ? clientId.substring(0, 20) + '...' : 'MISSING',
      clientSecretPrefix: clientSecret ? clientSecret.substring(0, 10) + '...' : 'MISSING',
      refreshTokenPrefix: refreshToken ? refreshToken.substring(0, 10) + '...' : 'MISSING',
      calendarId: calendarId || 'MISSING',
    },
    authTest: null as any,
    calendarTest: null as any,
  };

  if (!clientId || !clientSecret || !refreshToken) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Missing OAuth credentials',
        results,
      }, null, 2),
    };
  }

  try {
    console.log('All OAuth environment variables are set');
    console.log('Creating OAuth client...');

    // Create OAuth client
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'http://localhost'
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    results.authTest = 'OAuth client created successfully';
    console.log('OAuth client created');

    // Try to access calendar
    console.log('Testing calendar API access...');
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const testCalendarId = calendarId || 'dubai.rent7.0srl@gmail.com';

    // Try to list events (just 1) to test access
    const response = await calendar.events.list({
      calendarId: testCalendarId,
      maxResults: 1,
      timeMin: new Date().toISOString(),
    });

    results.calendarTest = {
      status: 'Calendar API access successful!',
      calendarId: testCalendarId,
      canReadEvents: true,
    };

    console.log('Calendar API access works!');

    // Try to create a test event
    console.log('Creating test event...');
    const testEvent = {
      summary: 'TEST - Calendar OAuth Working!',
      description: 'This is a test event to verify OAuth is working. You can delete this.',
      start: {
        dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
        timeZone: 'Europe/Rome',
      },
      end: {
        dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        timeZone: 'Europe/Rome',
      },
    };

    const createResponse = await calendar.events.insert({
      calendarId: testCalendarId,
      requestBody: testEvent,
    });

    results.calendarTest.testEventCreated = 'Test event created successfully!';
    results.calendarTest.eventId = createResponse.data.id;
    results.calendarTest.eventLink = createResponse.data.htmlLink;

    console.log('Test event created:', createResponse.data.id);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Google Calendar OAuth is working perfectly!',
        results,
        testEventLink: createResponse.data.htmlLink,
      }, null, 2),
    };

  } catch (error: any) {
    console.error('Calendar test failed:', error.message);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Calendar test failed',
        errorMessage: error.message,
        errorDetails: error.response?.data || error.toString(),
        results,
      }, null, 2),
    };
  }
};

export { handler };
