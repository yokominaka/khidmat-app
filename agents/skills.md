# KhidmatApp Orchestration Flow
1. Listen to /api/orchestrator/analyze-intent
2. If confidence_score < 0.75, halt execution and trigger a user confirmation question.
3. Pass valid payload metadata directly to match-providers step.
4. Pass chosen candidate data down to the Dynamic Pricing block.