# 🏠 KhidmatApp — AI-Powered Home Services Platform

> **Hackathon Project** — An intelligent service marketplace for Pakistan's informal economy, powered by a multi-agent AI orchestration engine.

KhidmatApp connects users with local service providers (AC technicians, electricians, plumbers, beauticians) through a conversational AI interface that understands Roman Urdu, English, and code-switched input. Behind the scenes, a swarm of specialized AI agents handles everything from intent parsing to dynamic pricing to dispute resolution.

---

## 📐 Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                   React Native (Expo)                │
│  ChatInput → ProviderList → Pricing → Booking →      │
│  LiveTracking → Feedback → Dispute                   │
└──────────────────────┬───────────────────────────────┘
                       │ REST API (fetch)
┌──────────────────────▼───────────────────────────────┐
│              Express.js Gateway (port 5000)           │
│                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ Intent Agent │→│ Matching     │→│ Pricing     │  │
│  │ (Gemini NLP) │  │ Agent        │  │ Agent       │  │
│  └─────────────┘  └──────────────┘  └─────────────┘ │
│          │                │                │          │
│  ┌───────▼───────┐  ┌────▼─────┐  ┌──────▼──────┐  │
│  │ Booking Agent │  │ Follow-up│  │ Dispute     │  │
│  │ (Double-book  │  │ Agent    │  │ Agent       │  │
│  │  prevention)  │  │ (Timeline│  │ (Decision   │  │
│  └───────────────┘  │  sim)    │  │  tree)      │  │
│                      └──────────┘  └─────────────┘  │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│         Cloud Firestore + Google Maps API             │
│  Collections: providers, bookings, notifications,     │
│               agent_logs                              │
└──────────────────────────────────────────────────────┘
```

---

## 🔌 API Endpoints

| Method | Endpoint | Agent | Description |
|--------|----------|-------|-------------|
| `POST` | `/api/parse-intent` | Intent Agent | Parses Roman Urdu/English input into structured JSON via Gemini 2.5 Flash |
| `POST` | `/api/match-providers` | Matching Agent | Ranks providers using a weighted 6-factor scoring algorithm |
| `POST` | `/api/calculate-price` | Pricing Agent | Computes dynamic pricing with 7 factors (base, distance, urgency, complexity, surge, loyalty, budget) |
| `POST` | `/api/book-service` | Booking Agent | Handles booking transactions with double-booking prevention |
| `POST` | `/api/simulate-followup` | Follow-up Agent | Simulates post-booking timeline notifications |
| `POST` | `/api/submit-feedback` | Follow-up Agent | Submits star rating + comment; updates rolling average |
| `POST` | `/api/file-dispute` | Dispute Agent | Processes disputes through a severity-based decision tree |

---

## 🧮 Provider Matching: 6-Factor Weighted Algorithm

The Matching Agent scores every available provider using a composite weighted formula:

| Factor | Weight | Description |
|--------|--------|-------------|
| **Rating** | 25% | Normalized provider rating (1–5 → 0–1) |
| **Availability** | 20% | Exact time-slot match = 1.0, partial = 0.5, none = 0.0 |
| **Distance** | 20% | Google Maps API driving distance, capped at 20 km (closer = higher score) |
| **Specialization** | 15% | Exact skill match vs. general provider |
| **On-Time Reliability** | 15% | Historical punctuality score (0–1) |
| **Review Recency** | 5% | Exponential decay — recent reviews weighted more |

**Formula:**
```
score = (rating × 0.25) + (availability × 0.20) + (distance × 0.20) +
        (specialization × 0.15) + (onTime × 0.15) + (recency × 0.05)
```

Providers are sorted descending by `score`. The top recommendation includes a **reasoning trace** explaining why it beat the runner-up (e.g., "Selected despite being 1.8km farther due to 31% higher reliability").

---

## 🗃️ Provider Schema (Firestore)

```json
{
  "id": "prov_ac_001",
  "name": "Ali AC Services (G-13)",
  "service_types": ["AC technician"],
  "location": { "lat": 33.6442, "lng": 72.9918, "area": "G-13" },
  "rating": 4.5,
  "on_time_score": 0.96,
  "cancellation_rate": 0.02,
  "price_per_hour": 2500,
  "specializations": ["Inverter AC Fix", "Split AC Maintenance", "Gas Charging"],
  "availability_slots": ["09:00-12:00", "13:00-16:00", "17:00-20:00"],
  "risk_score": "low"
}
```

---

## 🤖 Antigravity Workflow Engine

The service lifecycle is orchestrated as a **state machine** with 7 states:

```
INTENT_PARSING → PROVIDER_MATCHING → PRICING → BOOKING →
LIVE_TRACKING → FEEDBACK → DISPUTE_RESOLUTION (optional)
```

Each transition is driven by the API response of the previous state:
- If `confidence_score < 0.70` → **loop back** to `INTENT_PARSING` with a clarification question
- If `ranked_list` is empty → **fallback** to broadening the search radius
- If `conflict: true` on booking → suggest alternative time slots
- If dispute `severity === "serious"` → **escalate** to human support, freeze funds

All transitions emit structured **reasoning traces** to `console.log` and Firestore `agent_logs`.

---

## 💰 Dynamic Pricing: 7-Factor Formula

| Factor | Formula | Example |
|--------|---------|---------|
| Base Price | `provider.price_per_hour × hours` | 2500 × 2 = 5000 PKR |
| Distance Cost | `max(0, km - 3) × 20` | 5 km → 40 PKR |
| Urgency | `× 1.0 / 1.2 / 1.5` | Same-day = ×1.2 |
| Complexity | `× 1.0 / 1.3 / 1.6` | Intermediate = ×1.3 |
| Surge (Peak Hours) | `× 1.3` if 17:00–20:00 | Evening booking = ×1.3 |
| Loyalty Discount | `−5%` if returning user | −325 PKR |
| Budget Alternative | Find cheaper provider | Suggest alternative |

---

## 🛡️ Dispute Resolution Decision Tree

| Severity | Action | Refund |
|----------|--------|--------|
| **Minor** | Auto-credit | PKR 100 flat |
| **Moderate** | Partial refund | 30% of booking total |
| **Serious** | Escalate to human + freeze funds | Full review |

Provider risk scoring: cancellation/no-show events increment `cancellation_rate`. If rate > 20%, provider is flagged as **HIGH RISK** and deprioritized in matching.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Firebase project with Firestore enabled
- Google Maps API key (Distance Matrix enabled)
- Gemini API key

### Backend Setup
```bash
cd backend
npm install
# Create .env with: PORT, GEMINI_KEY, MAPS_KEY, FIREBASE_PROJECT_ID
# Place firebase-service-account.json in backend/
node -r dotenv/config index.js
```

### Mobile Setup (Expo)
```bash
cd mobile
npm install
npx expo start
# Press 'w' for web, or scan QR with Expo Go app
```

### Environment Variables
| Variable | Description |
|----------|-------------|
| `PORT` | Backend server port (default: 5000) |
| `GEMINI_KEY` | Google Gemini API key for NLP processing |
| `MAPS_KEY` | Google Maps API key for distance calculations |
| `FIREBASE_PROJECT_ID` | Firebase project identifier |

---

## 📊 Cost & Latency Estimates

| Component | Latency | Cost per Request |
|-----------|---------|------------------|
| Gemini 2.5 Flash (NLP) | ~800ms–2s | ~$0.0001 (input) + ~$0.0004 (output) |
| Google Maps Distance Matrix | ~200ms | $5 per 1000 elements |
| Firestore Read/Write | ~50ms | $0.06 per 100K reads |
| **Full Booking Flow** | **~3–5s** | **~$0.005 total** |

---

## ⚠️ Assumptions & Limitations

### Assumptions
- Provider data is pre-seeded in Firestore (15 providers across 5 service categories)
- User authentication is simulated (hardcoded `user_id` strings)
- WhatsApp notifications are simulated via console logs
- Review recency uses a fixed 5-day decay (no real timestamp tracking)
- Geocoding uses a mock lookup table for Islamabad sectors

### Limitations
- No real-time GPS tracking (timeline is simulated with `setTimeout`)
- No payment gateway integration (prices are calculated but not charged)
- No image/voice input support (text-only NLP)
- Provider availability resets require manual Firestore updates
- Surge pricing is time-slot-based, not demand-based
- No multi-language UI (interface is English-only; NLP supports Urdu input)

---

## 📁 Project Structure

```
antigravity-service-app/
├── backend/
│   ├── agents/
│   │   ├── intentAgent.js        # Gemini-powered NLP
│   │   ├── matchingAgent.js      # 6-factor provider ranking
│   │   ├── pricingAgent.js       # Dynamic pricing engine
│   │   ├── bookingAgent.js       # Booking + double-booking prevention
│   │   ├── followupAgent.js      # Timeline simulation + feedback
│   │   └── disputeAgent.js       # Severity-based dispute resolution
│   ├── docs/                     # Stress test results & traces
│   ├── workflows/                # State machine definitions
│   ├── index.js                  # Express gateway
│   └── .env                      # API keys
├── mobile/
│   ├── screens/
│   │   ├── ChatInputScreen.js
│   │   ├── ProviderListScreen.js
│   │   ├── PricingScreen.js
│   │   ├── BookingConfirmationScreen.js
│   │   ├── LiveTrackingScreen.js
│   │   ├── FeedbackScreen.js
│   │   └── DisputeScreen.js
│   ├── config.js                 # API base URL config
│   └── App.js                    # Navigation + font loading
└── README.md
```

---

## 🏆 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native (Expo SDK 55) |
| Backend | Express.js (Node.js) |
| Database | Cloud Firestore |
| NLP Engine | Google Gemini 2.5 Flash |
| Distance API | Google Maps Distance Matrix |
| Fonts | Inter (Google Fonts) |
| Icons | Expo Vector Icons (Ionicons, Feather) |
| Animations | React Native Animated API |

---

*Built during a hackathon with ❤️ and Antigravity.*
