// backend/routes/intentAgent.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const ledgerPath = path.join(__dirname, '../task_ledger.json');

// System Prompt for bilingual (Roman Urdu + English) intent parsing
const GEMINI_SYSTEM_PROMPT = `
You are the "Intent & NLP Agent" for KhidmatApp, a local services orchestration platform in the Islamabad/Rawalpindi target locale.
Your task is to parse a mixed Roman Urdu/English (code-switched) user input requesting a home service (specifically AC services like repair, cleaning, servicing, compressor replacement, gas charging, filter unclogging, etc.).

You must extract the following variables and return them strictly in JSON format matching the schema below:
{
  "service_type": "string or null", // E.g., "AC Repair", "General Cleaning", "Filter Unclogging", "Compressor Replacement", "Gas Charging". Map user request to these standard services if possible.
  "location": "string or null", // E.g., "G-13", "I-8", "Saddar", "DHA", "Bahria Town", etc. Must capture target area in Islamabad/Rawalpindi if mentioned.
  "urgency": "high" | "medium" | "low", // Determine urgency from tone, words like "urgent", "jaldi", "today", "emergency", "abbi".
  "budget_sensitive": boolean, // Determine if the user is price-conscious, using words like "sasta", "cheap", "budget tight", "discount", "kam rates", "paise".
  "confidence_score": number, // A confidence score between 0.0 and 1.0 indicating how confident you are in the extracted variables. If the input is vague, ambiguous, or lacks critical details (like service_type or location), the confidence score must be low (< 0.75).
  "clarifying_question": "string or null", // IF confidence_score is less than 0.75, you MUST provide an alternate clarifying question in mixed Roman Urdu/English to ask the user for clarification. Else, set this to null.
  "reasoning": "string" // A brief explanation of your parsing logic for the trace ledger.
}

Examples of mixed Roman Urdu / English inputs:
1. "Mera AC bilkul cooling nahi kar raha, bohat garam hai room, emergency repair chahiye G-13 me."
Expected output JSON:
{
  "service_type": "AC Repair",
  "location": "G-13",
  "urgency": "high",
  "budget_sensitive": false,
  "confidence_score": 0.95,
  "clarifying_question": null,
  "reasoning": "Extracted high urgency from 'emergency repair' and 'bohat garam'. Service type AC Repair from 'cooling nahi kar raha' and 'repair'. Location G-13."
}

2. "AC saaf karwana hai saste me rawalpindi saddar."
Expected output JSON:
{
  "service_type": "General Cleaning",
  "location": "Saddar",
  "urgency": "medium",
  "budget_sensitive": true,
  "confidence_score": 0.90,
  "clarifying_question": null,
  "reasoning": "Extracted service type General Cleaning from 'saaf karwana'. Budget sensitive is true due to 'saste me'. Location Saddar."
}

3. "AC chal nahi raha."
Expected output JSON:
{
  "service_type": "AC Repair",
  "location": null,
  "urgency": "medium",
  "budget_sensitive": false,
  "confidence_score": 0.60,
  "clarifying_question": "Aapka AC kis area (location) mein repair hona hai, aur kiya koi budget ya urgency issue hai?",
  "reasoning": "Extracted service AC Repair but location is missing, leading to confidence score 0.60 (< 0.75). Generated clarifying question."
}

Ensure the output is valid JSON, containing NO markdown styling, code blocks, or preamble outside the JSON structure itself.
`;

/**
 * Appends operational reasoning and results to the centralized task ledger.
 */
function writeToLedger(agentName, action, input, result, reasoning) {
  let ledger = [];
  try {
    if (fs.existsSync(ledgerPath)) {
      const data = fs.readFileSync(ledgerPath, 'utf8');
      ledger = JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading task ledger:", err);
  }

  const newEntry = {
    timestamp: new Date().toISOString(),
    agent: agentName,
    action: action,
    input: input,
    result: result,
    reasoning: reasoning
  };

  ledger.push(newEntry);

  try {
    fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2), 'utf8');
    console.log("📝 Task ledger successfully updated by", agentName);
  } catch (err) {
    console.error("Error writing to task ledger:", err);
  }
}

/**
 * Clean potential markdown wrappers from JSON string.
 */
function cleanJsonResponse(rawText) {
  let cleaned = rawText.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return JSON.parse(cleaned.trim());
}

/**
 * Highly robust rule-based parsing fallback if Gemini API is unavailable.
 */
function localLinguisticFallback(userInput) {
  const normalized = userInput.toLowerCase();
  
  let service_type = null;
  let location = null;
  let urgency = "medium";
  let budget_sensitive = false;
  let confidence_score = 0.5;

  // Service Type mapping
  if (normalized.includes("ac repair") || normalized.includes("thanda nahi") || normalized.includes("cooling nahi") || normalized.includes("kharab") || normalized.includes("chal nahi")) {
    service_type = "AC Repair";
  } else if (normalized.includes("clean") || normalized.includes("saaf") || normalized.includes("wash") || normalized.includes("dhona") || normalized.includes("cleaning")) {
    service_type = "General Cleaning";
  } else if (normalized.includes("compressor") || normalized.includes("compressor replacement")) {
    service_type = "Compressor Replacement";
  } else if (normalized.includes("gas") || normalized.includes("charging") || normalized.includes("recharge")) {
    service_type = "Gas Charging";
  } else if (normalized.includes("filter") || normalized.includes("unclog") || normalized.includes("jam")) {
    service_type = "Filter Unclogging";
  }

  // Location mapping (Islamabad/Rawalpindi focus)
  if (normalized.includes("g-13") || normalized.includes("g13")) {
    location = "G-13";
  } else if (normalized.includes("i-8") || normalized.includes("i8")) {
    location = "I-8";
  } else if (normalized.includes("saddar") || normalized.includes("sudar")) {
    location = "Saddar";
  } else if (normalized.includes("bahria")) {
    location = "Bahria Town";
  } else if (normalized.includes("dha")) {
    location = "DHA";
  } else if (normalized.includes("f-10") || normalized.includes("f10")) {
    location = "F-10";
  } else if (normalized.includes("f-8") || normalized.includes("f8")) {
    location = "F-8";
  }

  // Urgency detection
  if (normalized.includes("urgent") || normalized.includes("emergency") || normalized.includes("jaldi") || normalized.includes("aaj hi") || normalized.includes("abbi")) {
    urgency = "high";
  } else if (normalized.includes("sukoon") || normalized.includes("arram") || normalized.includes("weekend") || normalized.includes("later")) {
    urgency = "low";
  }

  // Budget sensitivity
  if (normalized.includes("cheap") || normalized.includes("sasta") || normalized.includes("budget") || normalized.includes("discount") || normalized.includes("kam paise") || normalized.includes("kam rates")) {
    budget_sensitive = true;
  }

  // Determine confidence
  if (service_type && location) {
    confidence_score = 0.85;
  } else if (service_type || location) {
    confidence_score = 0.70;
  }

  const clarifying_question = confidence_score < 0.75 
    ? "Aapka AC kis area (location) mein repair hona hai, aur kiya koi budget ya urgency issue hai?" 
    : null;

  return {
    service_type,
    location,
    urgency,
    budget_sensitive,
    confidence_score,
    clarifying_question,
    reasoning: "Parsed via rule-based local linguistic fallback pattern."
  };
}

/**
 * Centralized intent analyzer calling Gemini with local fallback.
 */
async function analyzeIntent(userInput) {
  if (!userInput || typeof userInput !== 'string') {
    throw new Error("Invalid user input provided.");
  }

  const apiKey = process.env.GEMINI_KEY;
  if (!apiKey) {
    console.warn("⚠️ GEMINI_KEY not found in environment. Using rule-based local parser.");
    const fallbackResult = localLinguisticFallback(userInput);
    writeToLedger("Intent_NLP_Agent", "analyze-intent-fallback", userInput, fallbackResult, fallbackResult.reasoning);
    return fallbackResult;
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              { text: GEMINI_SYSTEM_PROMPT + `\n\nUser Input: "${userInput}"` }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 12000
      }
    );

    const rawText = response.data.candidates[0].content.parts[0].text;
    const parsedData = cleanJsonResponse(rawText);

    // Enforce GEMINI.md rules: Confidence < 75% requires clarifying question
    if (parsedData.confidence_score < 0.75 && !parsedData.clarifying_question) {
      parsedData.clarifying_question = "Aapka AC kis area (location) mein repair hona hai, aur kiya koi budget ya urgency issue hai?";
    }

    writeToLedger("Intent_NLP_Agent", "analyze-intent-gemini", userInput, parsedData, parsedData.reasoning);
    return parsedData;

  } catch (error) {
    console.error("❌ Gemini API invocation failed. Activating local fallback mechanism...", error.message);
    const fallbackResult = localLinguisticFallback(userInput);
    fallbackResult.reasoning = `[API Error Fallback] ${fallbackResult.reasoning}`;
    writeToLedger("Intent_NLP_Agent", "analyze-intent-error-fallback", userInput, fallbackResult, fallbackResult.reasoning);
    return fallbackResult;
  }
}

// Router Endpoint
router.post('/analyze', async (req, res) => {
  const { userInput } = req.body;
  
  if (!userInput) {
    return res.status(400).json({ error: "userInput string is required in request body." });
  }

  try {
    const result = await analyzeIntent(userInput);
    res.json({
      status: "success",
      agent: "Intent_NLP_Agent",
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = {
  router,
  analyzeIntent
};
