const { ConvexHttpClient } = require("convex/dist/browser.js");

async function testConvexConnection() {
  const CONVEX_URL = process.env.CONVEX_URL || "https://utmost-porcupine-898.convex.cloud";
  console.log("Testing Convex connection to:", CONVEX_URL);
  
  try {
    const convex = new ConvexHttpClient(CONVEX_URL);
    
    // Test the listBrokers query
    const brokers = await convex.query("brokers:listBrokers");
    console.log("✓ Successfully connected to Convex!");
    console.log("Current brokers:", brokers);
    
    return true;
  } catch (error) {
    console.error("✗ Failed to connect to Convex:", error.message);
    console.error("Full error:", error);
    return false;
  }
}

testConvexConnection();
