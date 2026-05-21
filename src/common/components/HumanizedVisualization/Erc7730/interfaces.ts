import { HumanizerErc7730Visualization } from '@ambire-common/libs/humanizer/interfaces'

export type EditApprovalCallInfo = {
  setter: (arg: string, token: string, closeModal: () => void) => void
  amount: bigint
  token: string
  callId?: string
}

export interface Erc7730StructuredAddressActionsProps {
  address: string
  chainId: bigint
  hideLinks?: boolean
}

export interface Erc7730StructuredAddressProps {
  address: string
  chainId: bigint
  textSize: number
  hideLinks?: boolean
}

export interface Erc7730StructuredVisualizationProps {
  item: HumanizerErc7730Visualization & { id: number }
  chainId: bigint
  sizeMultiplierSize: number
  textSize: number
  hideLinks?: boolean
  mode?: 'summary' | 'description'
  editApprovalCallInfo?: EditApprovalCallInfo
}

export type Erc7730Row = HumanizerErc7730Visualization['rows'][number]
