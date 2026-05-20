const axios = require('axios');
require('dotenv').config();

const INTENT_SYSTEM_PROMPT = `
You are the Lead Intent & NLP Agent for KhidmatApp. Your task is to process incoming multilingual service requests (English, Urdu script, Roman Urdu, and code-switched mixtures) from Pakistan's informal economy.

You must analyze the text and return a STRICT JSON object containing exactly the following keys:
1. "service_type": Standardized string (e.g., "AC technician", "plumber", "electrician", "tutor", "beautician", "mechanic"). Put null if totally ambiguous.
2. "location": Standardized sector or area name (e.g., "G-13", "I-8", "F-10", "Saddar"). Put null if completely missing.
3. "urgency": "high", "medium", or "low".
4. "preferred_time": Extracted time window phrase string (e.g., "Tomorrow morning", "Immediate", "Next Sunday").
5. "budget_sensitivity": "high", "medium", or "low". (e.g., phrases like "budget kam hai" or "cheap" mean high sensitivity).
6. "confidence_score": A floating point between 0.0 and 1.0. Lower this score significantly if location or service_type is missing, highly misspelled, or completely ambiguous.
7. "clarification_question": If confidence_score is LESS than 0.70, write a polite clarification question in mixed Roman Urdu/English asking for missing fields. If confidence is high, this MUST be null.

---
FEW-SHOT EXAMPLES FOR YOUR TRAINING:

Example 1 (High Urgency Roman Urdu):
Input: "AC bilkul kaam nahi kar raha, kal subah G-13 mein technician chahiye, budget zyada nahi hai."
Output: {
  "service_type": "AC technician",
  "location": "G-13",
  "urgency": "high",
  "preferred_time": "Tomorrow morning",
  "budget_sensitivity": "high",
  "confidence_score": 0.95,
  "clarification_question": null
}

Ensure the output contains ONLY the raw valid JSON payload. No markdown blocks, no triple backticks (\`\`\`).
`;

async function testUrdu() {
  const userInput = "جی الیکٹریشن چاہیے ابھی آئی ایٹ میں شارٹ سرکٹ ہوا ہے";
  const apiKey = process.env.GEMINI_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{
      parts: [
        { text: INTENT_SYSTEM_PROMPT },
        { text: `User Input to process: "${userInput}"` }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json"
    }
  };

  try {
    const apiResponse = await axios.post(url, payload);
    const rawTextResponse = apiResponse.data.candidates[0].content.parts[0].text.trim();
    console.log("Raw Response from Gemini:");
    console.log(rawTextResponse);
    const parsed = JSON.parse(rawTextResponse);
    console.log("Parsed JSON successfully:");
    console.log(parsed);
  } catch (error) {
    console.error("Error invoking Gemini:", error.message);
    if (error.response) {
      console.error("API response data:", JSON.stringify(error.response.data, null, 2));
    }
  }
}

testUrdu();
