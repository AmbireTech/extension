import React, { useCallback } from 'react'
import { useModalize } from 'react-native-modalize'

import WalletStakingBottomSheet from './WalletStakingBottomSheet'
import WalletStakingCard from './WalletStakingCard'

const WalletStaking = () => {
  const { ref: sheetRef, open, close } = useModalize()

  const handleOpen = useCallback(() => open(), [open])
  const handleClose = useCallback(() => close(), [close])

  return (
    <>
      <WalletStakingCard onPress={handleOpen} />
      <WalletStakingBottomSheet sheetRef={sheetRef} closeBottomSheet={handleClose} />
    </>
  )
}

export default React.memo(WalletStaking)
