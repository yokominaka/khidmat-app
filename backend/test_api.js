// backend/test_api.js
const axios = require('axios');
require('dotenv').config();

async function checkApi() {
  const apiKey = process.env.GEMINI_KEY;
  console.log("Checking API key:", apiKey ? "FOUND" : "MISSING");
  
  // Try v1beta / gemini-1.5-flash
  const url1 = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  // Try v1 / gemini-1.5-flash
  const url2 = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  console.log("Testing url:", url1);
  try {
    const res = await axios.post(url1, {
      contents: [{ parts: [{ text: "Hello" }] }]
    });
    console.log("v1beta Success:", res.status, JSON.stringify(res.data).substring(0, 200));
    return;
  } catch (err) {
    console.log("v1beta Failed:", err.message);
    if (err.response) {
      console.log("v1beta Response body:", JSON.stringify(err.response.data));
    }
  }

  console.log("\nTesting url:", url2);
  try {
    const res = await axios.post(url2, {
      contents: [{ parts: [{ text: "Hello" }] }]
    });
    console.log("v1 Success:", res.status, JSON.stringify(res.data).substring(0, 200));
  } catch (err) {
    console.log("v1 Failed:", err.message);
    if (err.response) {
      console.log("v1 Response body:", JSON.stringify(err.response.data));
    }
  }
}

checkApi();

