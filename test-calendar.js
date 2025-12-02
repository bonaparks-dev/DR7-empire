const { google } = require('googleapis');
// Load .env file manually
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

async function testCalendar() {
  console.log('🧪 Testing Google Calendar Integration...\n');

  // Check environment variables
  console.log('📋 Checking credentials:');
  console.log('✓ Service Account Email:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'Found' : '❌ MISSING');
  console.log('✓ Private Key:', process.env.GOOGLE_PRIVATE_KEY ? 'Found' : '❌ MISSING');
  console.log('✓ Calendar ID:', process.env.GOOGLE_CALENDAR_ID || 'dubai.rent7.0srl@gmail.com');
  console.log('');

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    console.error('❌ Missing required environment variables!');
    process.exit(1);
  }

  try {
    // Create auth client
    console.log('🔐 Creating authentication client...');
    const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    console.log('✅ Auth client created\n');

    // Create calendar client
    console.log('📅 Creating calendar client...');
    const calendar = google.calendar({ version: 'v3', auth });
    console.log('✅ Calendar client created\n');

    // Try to create a test event
    console.log('🎯 Creating test event...');
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'dubai.rent7.0srl@gmail.com';

    const startTime = new Date();
    startTime.setHours(startTime.getHours() + 1);
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);

    const event = {
      summary: '🧪 TEST EVENT - Car Wash Booking',
      description: 'This is a test event to verify Google Calendar integration works correctly. You can delete this.',
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'Europe/Rome',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Europe/Rome',
      },
    };

    console.log('Calendar ID:', calendarId);
    console.log('Event start:', startTime.toISOString());
    console.log('');

    const response = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: event,
    });

    console.log('✅ SUCCESS! Test event created!');
    console.log('📅 Event ID:', response.data.id);
    console.log('🔗 Event link:', response.data.htmlLink);
    console.log('\n🎉 Google Calendar integration is working correctly!');
    console.log('📝 Check your calendar - you should see the test event.');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('\nFull error details:');
    console.error(error);

    if (error.message.includes('Calendar usage limits exceeded')) {
      console.log('\n💡 This means the API is working, but you hit rate limits. Try again in a minute.');
    } else if (error.message.includes('not found')) {
      console.log('\n💡 Calendar not found. Check that the calendar ID is correct and shared with the service account.');
    } else if (error.message.includes('Permission denied')) {
      console.log('\n💡 Permission denied. Make sure the calendar is shared with:');
      console.log('   ', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
      console.log('   with "Make changes to events" permission.');
    }
  }
}

testCalendar();
