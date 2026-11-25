import React, { useMemo } from 'react'
import { ViewStyle } from 'react-native'

import type { Call } from '@ambire-common/libs/accountOp/types'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useSafeApiSetting from '@common/hooks/useSafeApiSetting'
import SafeApiDisabledAlert from '@common/modules/auth/components/SafeApiDisabledAlert'
import { isSafeApproveHashCall } from '@web/modules/hardware-wallet/libs/pq1/safeApproval'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectKeys = (state: AllControllersMappingType['KeystoreController']) => state.keys

/**
 * Shown when a PQ1 account is asked to approve a Safe transaction while the user opted out of
 * the Safe API ("Sync Safe accounts" in the privacy settings). The PQ1 gets the details of the
 * Safe transaction it shows on the device from there, so it refuses to sign until sync is on.
 */
const Pq1SafeApprovalSyncAlert = ({
  accountAddr,
  calls,
  style
}: {
  accountAddr: string
  calls: Call[]
  style?: ViewStyle
}) => {
  const { t } = useTranslation()
  const { isSafeApiEnabled } = useSafeApiSetting()
  const { state: keys } = useController('KeystoreController', selectKeys)

  const isPq1SafeApproval = useMemo(() => {
    // A PQ1 account is controlled by its own key, of the PQ1 type
    const isPq1Account = keys.some(
      (key) => key.type === 'pq1' && key.addr.toLowerCase() === accountAddr.toLowerCase()
    )

    return isPq1Account && calls.some((call) => isSafeApproveHashCall(call.data))
  }, [keys, accountAddr, calls])

  if (isSafeApiEnabled || !isPq1SafeApproval) return null

  return (
    <SafeApiDisabledAlert
      style={style}
      text={t(
        'Your PQ1 shows you the Safe transaction it approves, and gets its details through sync. Turn on sync to approve it with your PQ1.'
      )}
    />
  )
}

export default React.memo(Pq1SafeApprovalSyncAlert)
