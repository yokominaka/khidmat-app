const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Ensure Firebase is initialized
if (!admin.apps.length) {
    const serviceAccount = require('../firebase-service-account.json');
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

router.post('/book-service', async (req, res) => {
    const { user_id, provider_id, date, time_slot, price_total, notes } = req.body;

    if (!user_id || !provider_id || !date || !time_slot || !price_total) {
        return res.status(400).json({ error: "Missing required booking fields." });
    }

    try {
        // 1. Double-Booking Check
        const existingBookings = await db.collection('bookings')
            .where('provider_id', '==', provider_id)
            .where('slot.date', '==', date)
            .where('slot.time', '==', time_slot)
            .where('status', '==', 'confirmed')
            .get();

        const providerRef = db.collection('providers').doc(provider_id);
        const providerDoc = await providerRef.get();

        if (!providerDoc.exists) {
            return res.status(404).json({ error: "Provider not found." });
        }
        const providerData = providerDoc.data();

        if (!existingBookings.empty) {
            // Conflict exists! Do NOT hard fail. Suggest next 3 available slots.
            const allSlots = providerData.availability_slots || [];
            const remainingSlots = allSlots.filter(s => s !== time_slot).slice(0, 3);
            
            console.log("🧠 [ANTIGRAVITY BOOKING TRACE]: Conflict detected. Suggesting alternative slots.");
            return res.json({
                success: false,
                conflict: true,
                message: "This slot was just booked by someone else! Here are the next available slots for this provider.",
                suggested_slots: remainingSlots
            });
        }

        // 2. No conflict. Proceed with booking transaction.
        const booking_id = `book_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        const newBooking = {
            booking_id,
            user_id,
            provider_id,
            service_type: providerData.service_types[0],
            slot: { date, time: time_slot },
            status: "confirmed",
            price_breakdown: { total: price_total },
            notes: notes || "",
            created_at: new Date().toISOString()
        };

        // Write to Bookings collection
        await db.collection('bookings').doc(booking_id).set(newBooking);

        // Remove slot from provider's availability
        await providerRef.update({
            availability_slots: admin.firestore.FieldValue.arrayRemove(time_slot)
        });

        // 3. Generate Receipt
        const receipt = {
            booking_id,
            qr_stub: `KHIDMAT-${booking_id.toUpperCase()}-${provider_id}`,
            provider_details: {
                name: providerData.name,
                location: providerData.location.area
            },
            price_total: price_total,
            slot: `${date} @ ${time_slot}`
        };

        // 4. Simulate WhatsApp Notification
        const notificationMsg = `Hi! Your booking (${booking_id}) with ${providerData.name} is confirmed for ${date} at ${time_slot}. Total: ${price_total} PKR.`;
        console.log(`\n======================================\n📱 [WHATSAPP NOTIFICATION SIMULATION]\nTo: User ${user_id}\nMessage: ${notificationMsg}\n======================================\n`);

        await db.collection('notifications').add({
            user_id,
            booking_id,
            message: notificationMsg,
            status: "sent",
            timestamp: new Date().toISOString()
        });

        return res.json({
            success: true,
            conflict: false,
            message: "Booking confirmed successfully!",
            receipt: receipt
        });

    } catch (error) {
        console.error("❌ Booking logic failure:", error);
        return res.status(500).json({ success: false, error: "Failed to process booking." });
    }
});

module.exports = router;
