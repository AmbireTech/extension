export const getIsDelegationEnableDisabled = (
  isEip7702Enabled: boolean,
  delegatedContract?: string | null
) => !isEip7702Enabled && !delegatedContract
