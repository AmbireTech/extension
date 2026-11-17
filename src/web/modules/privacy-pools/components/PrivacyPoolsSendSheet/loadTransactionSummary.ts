import type TransactionSummaryComponent from '@common/modules/sign-account-op/components/TransactionSummary'

export type TransactionSummaryType = typeof TransactionSummaryComponent

/**
 * Loads the transaction summary on demand, keeping the humanizer and its large address dataset
 * out of the dashboard's eager bundle. Not `React.lazy`, as it suspends on its first render even
 * once loaded, which would flash a placeholder in the confirmation sheet.
 */
const loadTransactionSummary = async (): Promise<TransactionSummaryType> =>
  (await import('@common/modules/sign-account-op/components/TransactionSummary')).default

export default loadTransactionSummary
