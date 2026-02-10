import type { Handler } from "@netlify/functions";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${process.env.URL}/.netlify/functions/google-calendar-callback`;

export const handler: Handler = async (event) => {
  const code = event.queryStringParameters?.code;

  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No authorization code provided" }),
    };
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Google credentials not configured" }),
    };
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokens.error_description || "Failed to get tokens");
    }

    // Return the refresh token - SAVE THIS IN NETLIFY ENV AS GOOGLE_REFRESH_TOKEN
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html",
      },
      body: `
        <html>
          <head><title>Google Calendar Authorization</title></head>
          <body style="font-family: sans-serif; padding: 40px; background: #000; color: #fff;">
            <h1>Authorization Successful!</h1>
            <p>Copy this refresh token and add it to Netlify environment variables as <code>GOOGLE_REFRESH_TOKEN</code>:</p>
            <pre style="background: #222; padding: 20px; border-radius: 8px; overflow-x: auto;">${tokens.refresh_token}</pre>
            <h3>Steps to complete setup:</h3>
            <ol>
              <li>Go to Netlify Dashboard → Site Settings → Environment Variables</li>
              <li>Add new variable: <code>GOOGLE_REFRESH_TOKEN</code></li>
              <li>Paste the token above as the value</li>
              <li>Redeploy your site</li>
            </ol>
            <p>You can close this window now.</p>
          </body>
        </html>
      `,
    };
  } catch (error) {
    console.error("Error getting tokens:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to exchange authorization code",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
