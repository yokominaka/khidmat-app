// backend/test_payloads.js
const http = require('http');

const testCases = [
  {
    id: 1,
    title: "🧪 Test Input 1: Roman Urdu (High Confidence Target)",
    userInput: "AC bilkul kaam nahi kar raha, kal subah G-13 mein technician chahiye, budget zyada nahi hai."
  },
  {
    id: 2,
    title: "🧪 Test Input 2: Code-Switched Multilingual (Complex Mix)",
    userInput: "Kal subah G-13 mein plumber chahiye, pipe leaks water severely context short hai budget kam hai"
  },
  {
    id: 3,
    title: "🧪 Test Input 3: Pure Urdu Script",
    userInput: "جی الیکٹریشن چاہیے ابھی آئی ایٹ میں شارٹ سرکٹ ہوا ہے"
  },
  {
    id: 4,
    title: "🧪 Test Input 4: Highly Misspelled",
    userInput: "ac tekhnisan chaye g13 mian"
  },
  {
    id: 5,
    title: "🧪 Test Input 5: Low Confidence (Ambiguous Missing Data)",
    userInput: "bhai help me out instantly call me"
  }
];

function sendPostRequest(payload) {
  return new Promise((resolve, reject) => {
    const dataString = JSON.stringify(payload);
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/parse-intent',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ raw: body, error: e.message });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(dataString);
    req.end();
  });
}

async function runAll() {
  console.log("⚡ Initiating KhidmatApp API Intent Agent Payload Tests...\n");
  for (const tc of testCases) {
    console.log("================================================================================");
    console.log(tc.title);
    console.log(`Input: "${tc.userInput}"`);
    console.log("--------------------------------------------------------------------------------");
    try {
      const response = await sendPostRequest({ userInput: tc.userInput });
      console.log(JSON.stringify(response, null, 2));
    } catch (err) {
      console.error("Error executing request:", err.message);
    }
    console.log("================================================================================\n");
  }
}

runAll();
