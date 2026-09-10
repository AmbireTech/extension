import { HumanizerErc7730Visualization } from '@ambire-common/libs/humanizer/interfaces'

export type EditApprovalCallInfo = {
  setter: (arg: string, token: string, tokenChainId: bigint, closeModal: () => void) => void
  amount: bigint
  token: string
  callId?: string
}

export interface Erc7730StructuredAddressProps {
  address: string
  chainId: bigint
  textSize: number
}

export interface Erc7730StructuredVisualizationProps {
  item: HumanizerErc7730Visualization & { id: number }
  chainId: bigint
  sizeMultiplierSize: number
  textSize: number
  mode?: 'summary' | 'description'
  editApprovalCallInfo?: EditApprovalCallInfo
  hideNestedRows?: boolean
  hideMobileSummaryTitle?: boolean
  isTransactionSummaryLayout?: boolean
  hasTransactionSummaryHeaderRightControl?: boolean
  dappIconSize?: number
  /**
   * Lets the transaction summary render the title and the rows into separate slots,
   * so the title stays on the dropdown arrow's line while the rows sit below it.
   */
  transactionSummarySection?: 'all' | 'title' | 'rows'
  showDescriptionTitle?: boolean
  /**
   * How many levels of calls embedded in other calls are already rendered above this one.
   * Calls nested deeper than MAX_DISPLAYED_NESTED_CALLDATA_DEPTH are decoded by the
   * humanizer (so their warnings are not lost) but are not shown, because they make the
   * transaction unreadable.
   */
  nestingDepth?: number
}

export type Erc7730Row = HumanizerErc7730Visualization['rows'][number]
