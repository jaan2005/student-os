// Mirrors the backend's MAX_EXPLAIN_INPUT_CHARS default (config/constants.js).
// Client-side check is just for immediate feedback — the backend enforces
// this regardless, so it stays correct even if this constant drifts.
export const MAX_EXPLAIN_INPUT_CHARS = 8000

// Mirrors the backend's MAX_ASSISTANT_MESSAGE_CHARS default.
export const MAX_ASSISTANT_MESSAGE_CHARS = 4000
