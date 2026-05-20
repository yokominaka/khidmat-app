const fs = require('fs');

const files = [
    'agents/bookingAgent.js',
    'agents/disputeAgent.js',
    'agents/followupAgent.js',
    'agents/matchingAgent.js',
    'agents/pricingAgent.js'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Using a simpler string replacement that handles everything inside the block
    const regex = /if \(\!admin\.apps\.length\) \{[\s\S]*?admin\.initializeApp\(\{ credential: admin\.credential\.cert\(serviceAccount\) \}\);\s*\}/g;
    
    content = content.replace(regex, 
`if (!admin.apps.length) {
    try {
        let serviceAccount;
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            if (serviceAccount.private_key) {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\\\n/g, '\\n');
            }
        } else {
            serviceAccount = require('../firebase-service-account.json');
        }
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } catch(e) {
        console.error('Firebase Initialization Error:', e);
    }
}`);

    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
});
