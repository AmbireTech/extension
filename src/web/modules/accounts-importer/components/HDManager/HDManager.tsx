import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Title from '@common/components/Title'
import spacings from '@common/styles/spacings'
import LedgerManager from '@web/modules/accounts-importer/components/LedgerManager'
import TrezorManager from '@web/modules/accounts-importer/components/TrezorManager'
import { HARDWARE_WALLETS } from '@web/modules/hardware-wallet/constants/common'
import { HARDWARE_WALLETS_KEYS } from '@web/modules/hardware-wallet/contexts/hardwareWalletsContext/types'
import useHardwareWallets from '@web/modules/hardware-wallet/hooks/useHardwareWallets'

const MANAGER_MAP = {
  [HARDWARE_WALLETS.LEDGER]: LedgerManager,
  [HARDWARE_WALLETS.TREZOR]: TrezorManager
}

const HDManager = ({
  walletType
}: {
  walletType: typeof HARDWARE_WALLETS[HARDWARE_WALLETS_KEYS]
}) => {
  const { hardwareWallets } = useHardwareWallets()
  const { t } = useTranslation()

  const closeConnect = React.useCallback(() => {
    try {
      hardwareWallets[walletType].cleanUp()
    } catch (e) {
      console.log(e)
    }
  }, [hardwareWallets, walletType])

  React.useEffect(() => {
    window.addEventListener('beforeunload', () => {
      closeConnect()
    })

    return () => {
      closeConnect()
    }
  }, [closeConnect])

  const Manager = MANAGER_MAP[walletType]
  const name = walletType

  return (
    <View style={[spacings.mh, spacings.pv]}>
      <Title>{t('Connected to a {{name}} hardware device', { name })}</Title>
      <Manager />
    </View>
  )
}

export default React.memo(HDManager)
