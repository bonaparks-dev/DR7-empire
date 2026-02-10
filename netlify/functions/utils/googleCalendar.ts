import { google } from 'googleapis';

interface CalendarEventDetails {
  summary: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  customerEmail: string;
  customerName: string;
}

const getCalendarClient = () => {
  // Use OAuth2 authentication only
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Calendar OAuth credentials not configured. Required: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN');
  }

  console.log('Using OAuth2 authentication for Google Calendar');
  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'http://localhost' // redirect URI (not used for refresh token flow)
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
};

export const createCalendarEvent = async (eventDetails: CalendarEventDetails) => {
  try {
    const calendar = getCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'dubai.rent7.0srl@gmail.com';

    console.log(`Creating calendar event for: ${eventDetails.summary}`);
    console.log(`Customer: ${eventDetails.customerName} (${eventDetails.customerEmail})`);
    console.log(`Start: ${eventDetails.startDateTime}`);
    console.log(`End: ${eventDetails.endDateTime}`);
    console.log(`Calendar ID: ${calendarId}`);

    const event = {
      summary: eventDetails.summary,
      description: eventDetails.description,
      start: {
        dateTime: eventDetails.startDateTime,
        timeZone: 'Europe/Rome',
      },
      end: {
        dateTime: eventDetails.endDateTime,
        timeZone: 'Europe/Rome',
      },
      attendees: [
        { email: eventDetails.customerEmail, displayName: eventDetails.customerName },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: event,
      sendUpdates: 'all', // Send email notifications to attendees (OAuth2 supports this)
    });

    console.log('Calendar event created successfully!');
    console.log(`Event ID: ${response.data.id}`);
    console.log(`Event link: ${response.data.htmlLink}`);
    return response.data;
  } catch (error: any) {
    console.error('Error creating calendar event:', error.message);
    console.error('Error details:', {
      code: error.code,
      status: error.status,
      statusText: error.statusText,
      errors: error.errors,
    });

    // Provide more helpful error messages
    if (error.code === 401) {
      console.error('Authentication error: Refresh token may be expired or invalid');
    } else if (error.code === 403) {
      console.error('Permission error: Check if calendar is shared with the OAuth account');
    } else if (error.code === 404) {
      console.error('Calendar not found: Verify GOOGLE_CALENDAR_ID is correct');
    }

    throw error;
  }
};

export const formatCarRentalEvent = (booking: any): CalendarEventDetails => {
  const vehicleName = booking.vehicle_name;
  const pickupDate = new Date(booking.pickup_date);
  const dropoffDate = new Date(booking.dropoff_date);
  const customerName = booking.customer_name || booking.booking_details?.customer?.fullName || 'Cliente';
  const customerEmail = booking.customer_email || booking.booking_details?.customer?.email;
  const bookingId = booking.id.substring(0, 8).toUpperCase();
  const totalPrice = booking.price_total / 100;
  const currency = booking.currency || 'EUR';
  const vehicleType = booking.vehicle_type || 'car';

  // Determine service type based on vehicle type
  let servicePrefix = '';
  if (vehicleType === 'exotic' || vehicleType === 'supercar') {
    servicePrefix = 'EXOTIC SUPERCAR';
  } else if (vehicleType === 'urban') {
    servicePrefix = 'URBAN CAR';
  } else {
    servicePrefix = 'CAR RENTAL';
  }

  return {
    summary: `${servicePrefix} - ${vehicleName} - ${customerName}`,
    description: `
Booking ID: DR7-${bookingId}
Customer: ${customerName}
Email: ${customerEmail}
Vehicle: ${vehicleName}
Pickup Location: ${booking.pickup_location}
Total: ${new Intl.NumberFormat('it-IT', { style: 'currency', currency }).format(totalPrice)}
Payment: ${booking.payment_method === 'agency' ? 'In sede' : 'Online'}
Status: ${booking.payment_status === 'pending' ? 'In attesa' : 'Completato'}
    `.trim(),
    startDateTime: pickupDate.toISOString(),
    endDateTime: dropoffDate.toISOString(),
    customerEmail,
    customerName,
  };
};

export const deleteCalendarEvent = async (eventId: string) => {
  try {
    const calendar = getCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'dubai.rent7.0srl@gmail.com';

    console.log(`Deleting calendar event: ${eventId}`);
    console.log(`Calendar ID: ${calendarId}`);

    await calendar.events.delete({
      calendarId: calendarId,
      eventId: eventId,
      sendUpdates: 'all', // Notify attendees about cancellation
    });

    console.log('Calendar event deleted successfully!');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting calendar event:', error.message);

    // If event is already deleted or not found, consider it successful
    if (error.code === 404 || error.code === 410) {
      console.log('Event already deleted or not found, continuing...');
      return { success: true, alreadyDeleted: true };
    }

    throw error;
  }
};

export const formatCarWashEvent = (booking: any): CalendarEventDetails => {
  // appointment_date is now stored as a full ISO timestamp
  const appointmentDate = new Date(booking.appointment_date);
  const serviceName = booking.service_name;
  const customerName = booking.customer_name || booking.booking_details?.customer?.fullName || 'Cliente';
  const customerEmail = booking.customer_email || booking.booking_details?.customer?.email;
  const bookingId = booking.id.substring(0, 8).toUpperCase();
  const totalPrice = booking.price_total / 100;
  const currency = booking.currency || 'EUR';
  const additionalService = booking.booking_details?.additionalService;
  const notes = booking.booking_details?.notes;

  // Calculate duration based on service price:
  // €25 = 1h, €49 = 2h, €75 = 3h, €99 = 4h
  let durationHours = 1;
  if (totalPrice <= 25) durationHours = 1;
  else if (totalPrice <= 49) durationHours = 2;
  else if (totalPrice <= 75) durationHours = 3;
  else durationHours = 4;

  const endDate = new Date(appointmentDate);
  endDate.setHours(endDate.getHours() + durationHours);

  return {
    summary: `LUXURY WASH (${durationHours}h) - ${serviceName} - ${customerName}`,
    description: `
Booking ID: DR7-${bookingId}
Customer: ${customerName}
Email: ${customerEmail}
Phone: ${booking.customer_phone || 'N/A'}
Service: ${serviceName}
Duration: ${durationHours} hour${durationHours > 1 ? 's' : ''}
${additionalService ? `Additional: ${additionalService}` : ''}
Total: ${new Intl.NumberFormat('it-IT', { style: 'currency', currency }).format(totalPrice)}
${notes ? `Notes: ${notes}` : ''}

SLOT BLOCKED: ${appointmentDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
    `.trim(),
    startDateTime: appointmentDate.toISOString(),
    endDateTime: endDate.toISOString(),
    customerEmail,
    customerName,
  };
};
