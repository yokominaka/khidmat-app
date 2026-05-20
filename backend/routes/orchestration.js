// backend/routes/orchestration.js
const express = require('express');
const router = express.Router();
const { analyzeIntent } = require('./intentAgent');
// Import your mock data or database connection
const providers = require('../mock-data/providers.json'); 

// Endpoint 1: Intent & NLP Analysis
router.post('/analyze-intent', async (req, res) => {
    const { userInput } = req.body;
    
    if (!userInput) {
        return res.status(400).json({ error: "userInput is required." });
    }
    
    try {
        const parsedData = await analyzeIntent(userInput);
        
        const responseData = {
            status: "success",
            agent: "Intent_NLP_Agent",
            confidence_score: parsedData.confidence_score,
            extracted_data: {
                service_type: parsedData.service_type,
                location: parsedData.location,
                urgency: parsedData.urgency,
                budget_sensitive: parsedData.budget_sensitive
            },
            clarifying_question: parsedData.clarifying_question,
            reasoning: parsedData.reasoning
        };
        res.json(responseData);
    } catch (error) {
        res.status(500).json({ error: `Antigravity workflow execution failed: ${error.message}` });
    }
});

// Endpoint 2: Advanced Provider Matchmaking
const AREA_COORDINATES = {
    "G-13": { lat: 33.6432, lng: 72.9912 },
    "I-8": { lat: 33.6595, lng: 73.0241 },
    "Saddar": { lat: 33.5951, lng: 73.0543 },
    "F-10": { lat: 33.6844, lng: 73.0479 },
    "G-11": { lat: 33.6612, lng: 73.0081 },
    "H-13": { lat: 33.6288, lng: 72.9644 },
    "E-11": { lat: 33.7001, lng: 72.9815 },
    "I-9": { lat: 33.6515, lng: 73.0510 },
    "Murree Road": { lat: 33.6211, lng: 73.0722 }
};

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function mapServiceType(service) {
    if (!service) return "";
    const s = service.toLowerCase();
    if (s.includes("ac") || s.includes("clean") || s.includes("wash") || s.includes("compressor") || s.includes("gas") || s.includes("filter") || s.includes("unclog")) {
        return "AC technician";
    }
    if (s.includes("plumb")) return "plumber";
    if (s.includes("elec")) return "electrician";
    if (s.includes("tutor")) return "tutor";
    if (s.includes("beauty") || s.includes("salon")) return "beautician";
    if (s.includes("mech") || s.includes("car") || s.includes("auto")) return "mechanic";
    return s;
}

router.post('/match-providers', async (req, res) => {
    const { extracted_data } = req.body;
    
    if (!extracted_data) {
        return res.status(400).json({ error: "extracted_data is required." });
    }

    const { service_type, location, budget_sensitive } = extracted_data;
    
    // 1. Resolve User Coordinates
    let userCoords = AREA_COORDINATES["G-13"]; // Default center
    if (location && AREA_COORDINATES[location.toUpperCase()]) {
        userCoords = AREA_COORDINATES[location.toUpperCase()];
    } else if (location) {
        // Fuzzy match areas
        const found = Object.keys(AREA_COORDINATES).find(key => key.toLowerCase().includes(location.toLowerCase()));
        if (found) {
            userCoords = AREA_COORDINATES[found];
        }
    }

    const targetService = mapServiceType(service_type);
    
    // 2. Filter by service type compatibility
    const eligibleProviders = providers.filter(provider => {
        return provider.service_types.some(t => t.toLowerCase() === targetService.toLowerCase());
    });

    const candidates = eligibleProviders.length > 0 ? eligibleProviders : providers;

    // 3. Compute 6-Factor Scores
    const scoredCandidates = candidates.map(provider => {
        // Factor 1: Distance (Weight: 0.25)
        const distance = calculateDistance(
            userCoords.lat, 
            userCoords.lng, 
            provider.location.lat, 
            provider.location.lng
        );
        const distanceScore = 1 / (1 + distance);

        // Factor 2: Rating (Weight: 0.25)
        const ratingScore = provider.rating / 5.0;

        // Factor 3: On-Time Performance (Weight: 0.15)
        const onTimeScore = provider.on_time_score;

        // Factor 4: Cancellation Rate (Weight: 0.15)
        const cancellationScore = 1.0 - provider.cancellation_rate;

        // Factor 5: Hourly Rate / Budget (Weight: 0.20)
        let priceScore = 0;
        if (budget_sensitive) {
            priceScore = 1.0 - (provider.price_per_hour / 4000);
        } else {
            priceScore = 1.0 - (Math.abs(provider.price_per_hour - 2200) / 4000);
        }

        // Factor 6: Specialization Match (Bonus Weight: up to +0.10)
        let specBonus = 0;
        if (service_type && provider.specializations) {
            const hasSpec = provider.specializations.some(spec => 
                spec.toLowerCase().includes(service_type.toLowerCase()) || 
                service_type.toLowerCase().includes(spec.toLowerCase())
            );
            if (hasSpec) {
                specBonus = 0.10;
            }
        }

        const totalScore = (distanceScore * 0.25) + 
                           (ratingScore * 0.25) + 
                           (onTimeScore * 0.15) + 
                           (cancellationScore * 0.15) + 
                           (priceScore * 0.20) + 
                           specBonus;

        return {
            provider,
            distance_km: parseFloat(distance.toFixed(2)),
            scores: {
                distanceScore: parseFloat(distanceScore.toFixed(3)),
                ratingScore: parseFloat(ratingScore.toFixed(3)),
                onTimeScore: parseFloat(onTimeScore.toFixed(3)),
                cancellationScore: parseFloat(cancellationScore.toFixed(3)),
                priceScore: parseFloat(priceScore.toFixed(3)),
                specBonus
            },
            match_score: parseFloat(totalScore.toFixed(3))
        };
    });

    // Sort by Match Score descending
    scoredCandidates.sort((a, b) => b.match_score - a.match_score);

    const bestMatch = scoredCandidates[0];

    // Log to ledger or return trace
    res.json({
        agent: "Provider_Matching_Agent",
        trace_rationale: `Selected '${bestMatch.provider.name}' with match score of ${bestMatch.match_score} (Distance: ${bestMatch.distance_km}km, Price: PKR ${bestMatch.provider.price_per_hour}/hr, Rating: ${bestMatch.provider.rating}).`,
        recommended_provider: bestMatch.provider,
        distance_km: bestMatch.distance_km,
        match_score: bestMatch.match_score,
        ranking_details: scoredCandidates.slice(0, 3) // Return top 3 candidates for transparency
    });
});

module.exports = router;