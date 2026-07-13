import { SigningStatus } from '@ambire-common/interfaces/signAccountOp'
import { ISignAccountOpController } from '@ambire-common/interfaces/signAccountOp'

const getIsSignLoading = (status?: ISignAccountOpController['status']) =>
  status?.type === SigningStatus.InProgress ||
  status?.type === SigningStatus.UpdatesPaused ||
  status?.type === SigningStatus.WaitingForPaymaster ||
  status?.type === SigningStatus.Done

export { getIsSignLoading }
