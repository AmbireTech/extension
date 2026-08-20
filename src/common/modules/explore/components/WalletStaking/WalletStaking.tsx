import React, { useCallback } from 'react'

import { captureException } from '@common/config/analytics/CrashAnalytics'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useToast from '@common/hooks/useToast'
import { WALLET_STAKING_ROUTE_STORAGE_KEY } from '@common/modules/explore/constants/walletStaking'
import { ROUTES } from '@common/modules/router/constants/common'
import { storage } from '@common/services/storage'

import WalletStakingCard from './WalletStakingCard'

const WalletStaking = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { addToast } = useToast()

  const handleOpen = useCallback(async () => {
    if (isWeb) {
      try {
        await storage.set(WALLET_STAKING_ROUTE_STORAGE_KEY, true)
      } catch (error) {
        console.error('Failed to persist the WALLET staking route', error)
        captureException(error)
        addToast(t("We couldn't remember the staking page after the extension closes."), {
          type: 'error'
        })
      }
    }

    navigate(ROUTES.walletStaking)
  }, [addToast, navigate, t])

  return <WalletStakingCard onPress={handleOpen} />
}

export default React.memo(WalletStaking)
