const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Ensure Firebase is initialized
if (!admin.apps.length) {
    try {
        let serviceAccount;
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            if (serviceAccount.private_key) {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }
        } else {
            serviceAccount = require('../firebase-service-account.json');
        }
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } catch(e) {
        console.error('Firebase Initialization Error:', e);
    }
}
const db = admin.firestore();

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

router.post('/simulate-followup', async (req, res) => {
    const { booking_id } = req.body;

    if (!booking_id) {
        return res.status(400).json({ error: "Missing booking_id." });
    }

    try {
        console.log(`\n======================================`);
        console.log(`⏱️ [ANTIGRAVITY FOLLOW-UP TIMELINE SIMULATION] Started for booking: ${booking_id}`);
        console.log(`======================================`);

        // T-60min
        await sleep(500);
        console.log(`[T-60min] 📱 Notification to User: Just a reminder! Your provider is scheduled to arrive in 1 hour.`);

        // T-15min
        await sleep(500);
        console.log(`[T-15min] 📱 Notification to User: Your provider is en-route and should arrive soon.`);

        // T+0
        await sleep(500);
        console.log(`[T+0] 📱 Notification to User: Your provider has arrived at the location.`);

        // T+duration
        await sleep(500);
        console.log(`[T+duration] 📱 Notification to User: Your service is complete!`);
        
        // Trigger feedback collection
        await sleep(500);
        console.log(`\n[FEEDBACK TRIGGER] 📱 Notification to User: How was your experience? Please leave a rating (1-5 stars) and comment!`);
        console.log(`======================================\n`);

        return res.json({
            success: true,
            message: "Timeline simulated and feedback triggered successfully."
        });

    } catch (error) {
        console.error("❌ Follow-up logic failure:", error);
        return res.status(500).json({ success: false, error: "Failed to simulate follow-up." });
    }
});

router.post('/submit-feedback', async (req, res) => {
    const { provider_id, rating, comment } = req.body;

    if (!provider_id || rating === undefined) {
        return res.status(400).json({ error: "Missing provider_id or rating." });
    }

    try {
        const providerRef = db.collection('providers').doc(provider_id);
        const providerDoc = await providerRef.get();

        if (!providerDoc.exists) {
            return res.status(404).json({ error: "Provider not found." });
        }

        const providerData = providerDoc.data();
        const currentRating = providerData.rating || 5.0;

        // Rolling average mock: assuming 10 past reviews
        const newRating = ((currentRating * 10) + rating) / 11;
        const roundedRating = Math.round(newRating * 10) / 10;

        await providerRef.update({
            rating: roundedRating
        });

        console.log(`\n🧠 [ANTIGRAVITY FEEDBACK TRACE] Provider ${provider_id} received a ${rating}-star rating. Rating updated from ${currentRating} to ${roundedRating}. Comment: "${comment || 'N/A'}"\n`);

        return res.json({
            success: true,
            message: "Feedback submitted successfully.",
            old_rating: currentRating,
            new_rating: roundedRating
        });

    } catch (error) {
        console.error("❌ Feedback logic failure:", error);
        return res.status(500).json({ success: false, error: "Failed to submit feedback." });
    }
});

module.exports = router;


