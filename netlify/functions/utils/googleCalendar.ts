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

    console.log('Calendar event created:', response.data.id);
    return response.data;
  } catch (error: any) {
    console.error('Error creating calendar event:', error.message);
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
  let servicePrefix = '🚗';
  if (vehicleType === 'exotic' || vehicleType === 'supercar') {
    servicePrefix = '🏎️ EXOTIC SUPERCAR';
  } else if (vehicleType === 'urban') {
    servicePrefix = '🚗 URBAN CAR';
  } else {
    servicePrefix = '🚙 CAR RENTAL';
  }

  return {
    summary: `${servicePrefix} - ${vehicleName} - ${customerName}`,
    description: `
📋 Booking ID: DR7-${bookingId}
👤 Customer: ${customerName}
📧 Email: ${customerEmail}
🚗 Vehicle: ${vehicleName}
📍 Pickup Location: ${booking.pickup_location}
💰 Total: ${new Intl.NumberFormat('it-IT', { style: 'currency', currency }).format(totalPrice)}
💳 Payment: ${booking.payment_method === 'agency' ? 'In sede' : 'Online'}
📝 Status: ${booking.payment_status === 'pending' ? 'In attesa' : 'Completato'}
    `.trim(),
    startDateTime: pickupDate.toISOString(),
    endDateTime: dropoffDate.toISOString(),
    customerEmail,
    customerName,
  };
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

  // Calculate duration based on service price (€25 per hour formula)
  const durationHours = Math.ceil(totalPrice / 25);

  const endDate = new Date(appointmentDate);
  endDate.setHours(endDate.getHours() + durationHours);

  return {
    summary: `🚿 LUXURY WASH (${durationHours}h) - ${serviceName} - ${customerName}`,
    description: `
📋 Booking ID: DR7-${bookingId}
👤 Customer: ${customerName}
📧 Email: ${customerEmail}
📞 Phone: ${booking.customer_phone || 'N/A'}
🚿 Service: ${serviceName}
⏱️ Duration: ${durationHours} hour${durationHours > 1 ? 's' : ''}
${additionalService ? `➕ Additional: ${additionalService}` : ''}
💰 Total: ${new Intl.NumberFormat('it-IT', { style: 'currency', currency }).format(totalPrice)}
${notes ? `📝 Notes: ${notes}` : ''}

🔒 SLOT BLOCKED: ${appointmentDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
    `.trim(),
    startDateTime: appointmentDate.toISOString(),
    endDateTime: endDate.toISOString(),
    customerEmail,
    customerName,
  };
};
