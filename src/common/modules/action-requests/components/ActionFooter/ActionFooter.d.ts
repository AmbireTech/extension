import { Props as ButtonProps } from '@common/components/Button'
import { HoldToProceedButtonProps } from '@common/components/HoldToProceedButton'

type Props = {
  onReject?: () => void
  onResolve: () => void
  rejectButtonText?: string
  resolveButtonText?: string
  /**
   * Shown instead of `resolveButtonText` when that doesn't fit on one row. Only on mobile,
   * where the buttons share the row equally
   */
  resolveButtonShortText?: string
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
  /**
   * Replaces the resolve button with a hold-to-proceed one, so the request can't be approved by
   * accident - e.g. when the scam checker flags the app behind it
   */
  holdToProceed?: {
    text: string
    completeText?: string
    buttonType: HoldToProceedButtonProps['buttonType']
  }
  children?: React.ReactNode
}

declare const ActionFooter: React.FC<Props>
export default ActionFooter
