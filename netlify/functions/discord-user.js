
// Discord user info function
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
    const { access_token } = body;

    if (!access_token) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing access_token parameter" }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      };
    }

    // Discord API configuration
    const DISCORD_USER_URL = "https://discord.com/api/users/@me";

    // Fetch user info from Discord
    const response = await fetch(DISCORD_USER_URL, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Discord user info error:", errorText);
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: "Failed to fetch user info",
          details: errorText
        }),
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      };
    }

    // Return the user data
    const userData = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(userData),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    };
  } catch (error) {
    console.error("Error in discord-user function:", error);
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
