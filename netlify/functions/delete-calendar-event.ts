import type { Handler } from "@netlify/functions";
import { deleteCalendarEvent } from "./utils/googleCalendar";

export const handler: Handler = async (event) => {
  // Only allow DELETE or POST requests
  if (event.httpMethod !== "DELETE" && event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { eventId, google_event_id } = body;

    const calendarEventId = eventId || google_event_id;

    if (!calendarEventId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing eventId or google_event_id" }),
      };
    }

    console.log(`Attempting to delete Google Calendar event: ${calendarEventId}`);

    // Delete the event from Google Calendar
    const result = await deleteCalendarEvent(calendarEventId);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        message: result.alreadyDeleted
          ? "Event was already deleted"
          : "Calendar event deleted successfully",
      }),
    };
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to delete calendar event",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
