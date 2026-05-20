// backend/list_models.js
const axios = require('axios');
require('dotenv').config();

async function listModels() {
  const apiKey = process.env.GEMINI_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  console.log("Listing models using url:", url);
  try {
    const res = await axios.get(url);
    console.log("Success! Models list:");
    const models = res.data.models || [];
    models.forEach(m => {
      console.log(`- Name: ${m.name}, DisplayName: ${m.displayName}, SupportedMethods: ${m.supportedGenerationMethods.join(', ')}`);
    });
  } catch (err) {
    console.error("List models failed:", err.message);
    if (err.response) {
      console.error("Response body:", JSON.stringify(err.response.data));
    }
  }
}

listModels();
