type Props = {
  onReject?: () => void
  onResolve: () => void
  rejectButtonText?: string
  resolveButtonText?: string
  resolveDisabled?: boolean
  resolveType?: ButtonProps['type']
  rejectButtonTestID?: string
  resolveButtonTestID?: string
  /** Optional custom node to replace the default resolve button */
  resolveNode?: React.ReactNode
}

declare const ActionFooter: React.FC<Props>
export default ActionFooter
