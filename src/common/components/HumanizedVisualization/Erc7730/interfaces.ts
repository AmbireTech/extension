import { HumanizerErc7730Visualization } from '@ambire-common/libs/humanizer/interfaces'

export type EditApprovalCallInfo = {
  setter: (arg: string, token: string, closeModal: () => void) => void
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
}

export type Erc7730Row = HumanizerErc7730Visualization['rows'][number]
