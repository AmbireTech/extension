/**
 * Reported by every card service when the user backs out of a card session, so
 * the flows that start a session can tell a cancellation from a real failure.
 */
export const NFC_CANCELLED_MESSAGE = 'Card operation cancelled.'
