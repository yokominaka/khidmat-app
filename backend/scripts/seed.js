// backend/scripts/seed.js
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK using your service account credential key
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Target path lookups
const providersPath = path.join(__dirname, '../../mock-data/providers.json');
const bookingsPath = path.join(__dirname, '../../mock-data/bookings.json');

async function seedDatabase() {
  try {
    console.log('⏳ Parsing data files...');
    const providers = JSON.parse(fs.readFileSync(providersPath, 'utf8'));
    const bookings = JSON.parse(fs.readFileSync(bookingsPath, 'utf8'));

    console.log('🧹 Clearing old collections to keep data clean...');
    const clearCollection = async (collectionName) => {
      const snapshot = await db.collection(collectionName).get();
      if (snapshot.empty) {
        console.log(`ℹ️ Collection '${collectionName}' is already empty.`);
        return;
      }
      
      const docs = snapshot.docs;
      const batchSize = 500;
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = db.batch();
        const chunk = docs.slice(i, i + batchSize);
        chunk.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }
      console.log(`🧹 Cleared collection: '${collectionName}'`);
    };
    
    await clearCollection('providers');
    await clearCollection('bookings');

    console.log('🚀 Seeding Providers into Firestore...');
    if (providers.length > 0) {
      const pBatch = db.batch();
      providers.forEach((provider) => {
        const docRef = db.collection('providers').doc(provider.id);
        pBatch.set(docRef, provider);
      });
      await pBatch.commit();
      console.log(`✅ Successfully seeded ${providers.length} providers.`);
    } else {
      console.log('⚠️ No providers found to seed.');
    }

    console.log('🚀 Seeding Bookings into Firestore...');
    if (bookings.length > 0) {
      const bBatch = db.batch();
      bookings.forEach((booking) => {
        const docRef = db.collection('bookings').doc(booking.booking_id);
        bBatch.set(docRef, booking);
      });
      await bBatch.commit();
      console.log(`✅ Successfully seeded ${bookings.length} historic bookings.`);
    } else {
      console.log('⚠️ No bookings found to seed.');
    }

    console.log('\n🎉 Day 1 Afternoon Database Seeding Complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding operation encountered a fault:', error);
    process.exit(1);
  }
}

seedDatabase();
