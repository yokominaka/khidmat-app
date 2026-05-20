const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Ensure Firebase is initialized
if (!admin.apps.length) {
    const serviceAccount = require('../firebase-service-account.json');
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

router.post('/calculate-price', async (req, res) => {
    const { 
        user_id, 
        provider, 
        estimated_duration_hours, 
        distance_km, 
        urgency, 
        complexity, 
        time_slot, 
        budget_sensitivity 
    } = req.body;

    if (!user_id || !provider || !estimated_duration_hours || distance_km === undefined || !time_slot) {
        return res.status(400).json({ error: "Missing required pricing fields." });
    }

    try {
        let breakdown = {};
        
        // 1. Base Price
        let basePrice = provider.price_per_hour * estimated_duration_hours;
        breakdown.base_price = basePrice;

        // 2. Distance Cost: PKR 20/km beyond 3km free radius
        let distanceCost = Math.max(0, distance_km - 3) * 20;
        breakdown.distance_cost = distanceCost;

        // 3. Urgency Multiplier
        let urgencyMultiplier = 1.0;
        if (urgency === "same-day") urgencyMultiplier = 1.2;
        else if (urgency === "emergency") urgencyMultiplier = 1.5;
        breakdown.urgency_multiplier = urgencyMultiplier;

        // 4. Complexity Multiplier
        let complexityMultiplier = 1.0;
        if (complexity === "intermediate") complexityMultiplier = 1.3;
        else if (complexity === "complex") complexityMultiplier = 1.6;
        breakdown.complexity_multiplier = complexityMultiplier;

        // 5. Surge Factor: peak hour (e.g., 17:00-20:00)
        let surgeFactor = 1.0;
        if (time_slot.includes("17:00") || time_slot.includes("18:00") || time_slot.includes("19:00")) {
            surgeFactor = 1.3;
        }
        breakdown.surge_factor = surgeFactor;

        // Subtotal before loyalty
        let subtotal = (basePrice + distanceCost) * urgencyMultiplier * complexityMultiplier * surgeFactor;
        
        // 6. Loyalty Discount
        let loyaltyDiscount = 0;
        const pastBookings = await db.collection('bookings')
            .where('user_id', '==', user_id)
            .where('status', '==', 'completed')
            .get();

        if (!pastBookings.empty) {
            loyaltyDiscount = subtotal * 0.05; // 5% discount
            breakdown.loyalty_discount_applied = true;
        } else {
            breakdown.loyalty_discount_applied = false;
        }
        breakdown.loyalty_discount_amount = -loyaltyDiscount;

        // Final Total
        let finalTotal = subtotal - loyaltyDiscount;

        // 7. Budget Alternative Logic
        let budgetAlternative = null;
        if (budget_sensitivity === "high") {
            const altSnapshot = await db.collection('providers')
                .where('service_types', 'array-contains', provider.service_types[0])
                .get();
                
            let cheaperProviders = [];
            altSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.price_per_hour < provider.price_per_hour) {
                    cheaperProviders.push(data);
                }
            });

            if (cheaperProviders.length > 0) {
                cheaperProviders.sort((a, b) => a.price_per_hour - b.price_per_hour);
                budgetAlternative = cheaperProviders[0];
            }
        }

        // Reasoning Trace
        let traceParts = [];
        traceParts.push(`Base: ${basePrice} PKR.`);
        if (distanceCost > 0) traceParts.push(`Travel (+${Math.round(distanceCost)} PKR for ${distance_km}km).`);
        if (urgencyMultiplier > 1) traceParts.push(`${urgency} urgency (${urgencyMultiplier}x).`);
        if (complexityMultiplier > 1) traceParts.push(`${complexity} complexity (${complexityMultiplier}x).`);
        if (surgeFactor > 1) traceParts.push(`Peak hours surge (${surgeFactor}x).`);
        if (loyaltyDiscount > 0) traceParts.push(`Loyalty discount applied (-${Math.round(loyaltyDiscount)} PKR).`);
        if (budgetAlternative) traceParts.push(`Budget alternative found: ${budgetAlternative.name}.`);

        const reasoningString = `Price calculated at ${Math.round(finalTotal)} PKR. ` + traceParts.join(' ');
        console.log("🧠 [ANTIGRAVITY PRICING TRACE]:", reasoningString);

        return res.json({
            success: true,
            total_pkr: Math.round(finalTotal),
            breakdown: breakdown,
            budget_alternative: budgetAlternative,
            reasoning_trace: reasoningString
        });

    } catch (error) {
        console.error("❌ Pricing logic failure:", error);
        return res.status(500).json({ success: false, error: "Failed to calculate price." });
    }
});

module.exports = router;
