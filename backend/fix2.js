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
    
    // Find the start of "if (!admin.apps.length) {"
    // Find the exact location of "const db = admin.firestore();"
    // Replace everything in between!
    
    const startIndex = content.indexOf('if (!admin.apps.length) {');
    const endIndex = content.indexOf('const db = admin.firestore();');
    
    if (startIndex !== -1 && endIndex !== -1) {
        const replacement = `if (!admin.apps.length) {
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
}
`;
        content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
        fs.writeFileSync(file, content);
        console.log(`Cleaned up ${file}`);
    }
});
