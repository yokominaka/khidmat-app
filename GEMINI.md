# KhidmatApp Project Rules & System Parameters

## 1. System Constraints
- **Target Locale:** Islamabad/Rawalpindi, Pakistan (e.g., G-13, I-8, Saddar).
- **Primary Technical Stack:** Node.js + Express backend gateway, React Native mobile frontend.
- **Data Schemas:** All provider selections must interact cleanly with `mock-data/providers.json`.

## 2. Multi-Agent Pipeline Rules
1. **Intent Extraction:** The `Intent & NLP Agent` must transform bilingual/code-switched inputs into structural JSON payloads. If confidence drops below 75%, it must yield an alternate clarifying question.
2. **Provider Matching:** The system must compute distance using coordinates and filter options based on the classified job complexity matching the provider's capabilities.
3. **Trace Documentation:** Every agent must output its operational reasoning to a structured task ledger before completing execution actions.