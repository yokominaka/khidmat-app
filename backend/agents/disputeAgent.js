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
} catch (e) {
        console.error('Firebase Initialization Error:', e);
        process.exit(1);
    }
}
const db = admin.firestore();

router.post('/file-dispute', async (req, res) => {
    const { booking_id, provider_id, user_id, issue_type, severity, details } = req.body;

    if (!booking_id || !provider_id || !user_id || !issue_type || !severity) {
        return res.status(400).json({ error: "Missing required dispute fields." });
    }

    try {
        let status = "pending";
        let refund_amount = 0;
        let provider_penalized = false;
        let traceReason = "";

        // Decision Tree
        if (severity === "minor") {
            // Auto-credit PKR 100
            refund_amount = 100;
            status = "resolved_auto";
            traceReason = "Minor issue detected. Automatically credited user PKR 100.";
        } else if (severity === "moderate") {
            // Fetch booking to get total price for 30% refund
            const bookingDoc = await db.collection('bookings').doc(booking_id).get();
            let original_total = 0;
            if (bookingDoc.exists && bookingDoc.data().price_breakdown) {
                original_total = bookingDoc.data().price_breakdown.total || 0;
            }
            
            refund_amount = Math.round(original_total * 0.30);
            status = "resolved_partial";
            traceReason = `Moderate issue detected. Issued 30% partial refund (PKR ${refund_amount}).`;
        } else if (severity === "serious") {
            // Freeze funds, flag provider
            status = "escalated_human";
            traceReason = "Serious issue detected. Provider flagged, booking funds frozen. Escalated to human support.";
            provider_penalized = true;
        }

        // Provider Risk Scoring
        let providerUpdates = {};
        if (issue_type === "cancellation" || issue_type === "no_show") {
            const providerRef = db.collection('providers').doc(provider_id);
            const providerDoc = await providerRef.get();
            
            if (providerDoc.exists) {
                const providerData = providerDoc.data();
                let currentCancelRate = providerData.cancellation_rate || 0;
                
                // Simulated formula for demo: bumping the cancellation rate slightly
                let newCancelRate = currentCancelRate + 0.05; 
                providerUpdates.cancellation_rate = newCancelRate;

                traceReason += ` | Provider cancellation rate updated to ${newCancelRate.toFixed(2)}.`;

                if (newCancelRate > 0.20) {
                    providerUpdates.risk_score = "high";
                    traceReason += ` | WARNING: Cancellation rate > 20%. Provider flagged as HIGH RISK and deprioritized in matching.`;
                }
                
                await providerRef.update(providerUpdates);
            }
        } else if (provider_penalized) {
            // If serious but not a cancellation, just flag them
             const providerRef = db.collection('providers').doc(provider_id);
             await providerRef.update({ flags: admin.firestore.FieldValue.arrayUnion(booking_id) });
        }

        // Log to agent_logs
        const logEntry = {
            agent: "disputeAgent",
            booking_id,
            user_id,
            provider_id,
            issue_type,
            severity,
            status,
            refund_amount,
            reason: traceReason,
            timestamp: new Date().toISOString()
        };

        await db.collection('agent_logs').add(logEntry);

        console.log(`\n🧠 [ANTIGRAVITY DISPUTE TRACE] Booking ${booking_id} | ${traceReason}\n`);

        return res.json({
            success: true,
            dispute_status: status,
            refund_amount: refund_amount,
            provider_flagged: providerUpdates.risk_score === "high",
            log: logEntry
        });

    } catch (error) {
        console.error("❌ Dispute logic failure:", error);
        return res.status(500).json({ success: false, error: "Failed to process dispute." });
    }
});

module.exports = router;


