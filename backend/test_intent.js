// backend/test_intent.js
const { analyzeIntent } = require('./routes/intentAgent');

async function runTests() {
  console.log("🧪 Starting Intent NLP Agent Test Suite...\n");

  const testCases = [
    {
      name: "High urgency, explicit location (Roman Urdu + English)",
      input: "Mera AC bilkul cooling nahi kar raha, bohat garam hai room, emergency repair chahiye G-13 me."
    },
    {
      name: "Budget sensitive AC service, explicit Rawalpindi location",
      input: "AC saaf karwana hai saste me rawalpindi saddar."
    },
    {
      name: "Vague service request without location (should trigger clarifying question)",
      input: "Mera AC chal nahi raha."
    },
    {
      name: "Short code-switched cleaning request in I-8",
      input: "AC cooling service in I-8 sector location please."
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    console.log(`--------------------------------------------------`);
    console.log(`CASE ${i + 1}: ${tc.name}`);
    console.log(`Input: "${tc.input}"`);
    console.log(`Processing...`);
    try {
      const start = Date.now();
      const result = await analyzeIntent(tc.input);
      const elapsed = Date.now() - start;
      
      console.log(`Status: SUCCESS (took ${elapsed}ms)`);
      console.log(`Extracted:`, JSON.stringify({
        service_type: result.service_type,
        location: result.location,
        urgency: result.urgency,
        budget_sensitive: result.budget_sensitive
      }, null, 2));
      console.log(`Confidence Score: ${result.confidence_score}`);
      if (result.clarifying_question) {
        console.log(`Clarifying Question: "${result.clarifying_question}"`);
      } else {
        console.log(`Clarifying Question: None needed`);
      }
      console.log(`Reasoning: "${result.reasoning}"`);
    } catch (err) {
      console.error(`Status: FAILED with error:`, err.message);
    }
    console.log(`--------------------------------------------------\n`);
  }
}

runTests();
