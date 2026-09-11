import React, { useCallback } from 'react'

import useNavigation from '@common/hooks/useNavigation'
import { ROUTES } from '@common/modules/router/constants/common'

import WalletStakingCard from './WalletStakingCard'

const WalletStaking = () => {
  const { navigate } = useNavigation()

  const handleOpen = useCallback(() => {
    navigate(ROUTES.walletStaking)
  }, [navigate])

  return <WalletStakingCard onPress={handleOpen} />
}

export default React.memo(WalletStaking)
