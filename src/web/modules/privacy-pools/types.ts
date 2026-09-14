/**
 * Which form the action sheet is showing. Deposit and withdraw are the only two things Privacy
 * Pools v1 can do with funds - there is no private transfer between users, so unlike Railgun there
 * is no third mode.
 */
export type PrivacyPoolsActionMode = 'deposit' | 'withdraw'
