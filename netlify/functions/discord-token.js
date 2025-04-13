
// Discord token exchange function
exports.handler = async (event) => {
  try {
    // Only accept POST requests
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      };
    }

    // Parse the request body
    const body = JSON.parse(event.body);
    const { code, redirect_uri } = body;

    if (!code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing code parameter" }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      };
    }

    // Discord API configuration
    const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "1360393180482375691";
    const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
    const DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token";

    if (!DISCORD_CLIENT_SECRET) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Server configuration error: Missing Discord client secret" }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      };
    }

    // Create form data for token exchange
    const formData = new URLSearchParams();
    formData.append("client_id", DISCORD_CLIENT_ID);
    formData.append("client_secret", DISCORD_CLIENT_SECRET);
    formData.append("grant_type", "authorization_code");
    formData.append("code", code);
    formData.append("redirect_uri", redirect_uri);

    // Exchange code for token
    const response = await fetch(DISCORD_TOKEN_URL, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Discord token exchange error:", errorText);
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: "Failed to exchange code for token",
          details: errorText
        }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      };
    }

    // Return the token response
    const tokenData = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(tokenData),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    };
  } catch (error) {
    console.error("Error in discord-token function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error", details: error.message }),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    };
  }
};
