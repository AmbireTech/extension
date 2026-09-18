type Props = {
  onReject?: () => void
  onResolve: () => void
  rejectButtonText?: string
  resolveButtonText?: string
  resolveDisabled?: boolean
  resolveType?: ButtonProps['type']
  rejectButtonTestID?: string
  resolveButtonTestID?: string
  /**
   * Turns Reject into a button that can also clear the app's whole queue or silence it.
   */
  withRejectOptions?: boolean
  /** Title of the reject options sheet, e.g. "Cancel connection". Needed with `withRejectOptions`. */
  rejectOptionsTitle?: string
  /** How the plain rejection reads as an option, e.g. "Cancel this connection". */
  rejectOptionText?: string
  /** Optional custom node to replace the default resolve button */
  resolveNode?: React.ReactNode
  children?: React.ReactNode
}

declare const ActionFooter: React.FC<Props>
export default ActionFooter
