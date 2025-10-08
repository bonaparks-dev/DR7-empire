import type { Handler } from "@netlify/functions";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${process.env.URL}/.netlify/functions/google-calendar-callback`;

export const handler: Handler = async () => {
  if (!GOOGLE_CLIENT_ID) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Google Client ID not configured" }),
    };
  }

  // Google OAuth authorization URL
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.append("client_id", GOOGLE_CLIENT_ID);
  authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("scope", "https://www.googleapis.com/auth/calendar");
  authUrl.searchParams.append("access_type", "offline");
  authUrl.searchParams.append("prompt", "consent");

  return {
    statusCode: 302,
    headers: {
      Location: authUrl.toString(),
    },
    body: "",
  };
};
