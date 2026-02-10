import React, { useState } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import DappControl from '@web/modules/dapp-catalog/components/DappControl'
import ManageDapp from '@web/modules/dapp-catalog/components/ManageDapp'
import { getUiType } from '@web/utils/uiType'

import getStyles from './styles'

const { isPopup } = getUiType()

const DAppFooter = () => {
  const { styles } = useTheme(getStyles)
  const { currentDapp, isLoadingCurrentDapp } = useController('DappsController')
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const [hovered, setHovered] = useState(false)

  if (!isPopup || isLoadingCurrentDapp || !currentDapp) return null

  return (
    <View style={styles.footerContainer}>
      <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <View
          style={[
            styles.container,
            currentDapp.blacklisted === 'BLACKLISTED' && styles.containerError
          ]}
        >
          <DappControl
            dapp={currentDapp}
            isHovered={hovered}
            inModal={false}
            isCurrentDapp
            openBottomSheet={openBottomSheet}
            closeBottomSheet={closeBottomSheet}
          />
        </View>
      </div>
      <ManageDapp
        dapp={currentDapp}
        isCurrentDapp
        sheetRef={sheetRef}
        openBottomSheet={openBottomSheet}
        closeBottomSheet={closeBottomSheet}
      />
    </View>
  )
}

export default React.memo(DAppFooter)
