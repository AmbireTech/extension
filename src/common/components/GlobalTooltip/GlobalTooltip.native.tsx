import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import InfoIcon from '@common/assets/svg/InfoIcon'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Text from '@common/components/Text'
import { tooltipManager } from '@common/components/Tooltip/TooltipManager'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

export function GlobalTooltip() {
  const { t } = useTranslation()
  const [activeTooltip, setActiveTooltip] = useState(tooltipManager.getActiveTooltip())
  const { ref: sheetRef, open: openSheet, close: closeSheet } = useModalize()
  const isClosingRef = React.useRef(false)
  const { theme } = useTheme()
  // Only update state from the subscription
  useEffect(() => {
    return tooltipManager.subscribe(() => {
      setActiveTooltip(tooltipManager.getActiveTooltip())
    })
  }, [])

  // Open/close the sheet after the BottomSheet has rendered with the new state
  useEffect(() => {
    if (activeTooltip) {
      isClosingRef.current = false
      openSheet()
    } else {
      closeSheet()
    }
  }, [activeTooltip, openSheet, closeSheet])

  return (
    <BottomSheet
      id="global-tooltip-sheet"
      sheetRef={sheetRef}
      type="modal"
      onClosed={() => {
        // Guard: only call hide() once per close to prevent infinite loop
        if (isClosingRef.current) return
        isClosingRef.current = true
        tooltipManager.hide()
      }}
      closeBottomSheet={closeSheet}
      HeaderComponent={
        <View>
          <View
            style={[
              flexbox.alignSelfCenter,
              { backgroundColor: theme.infoBackground, borderRadius: 50 }
            ]}
          >
            <InfoIcon width={30} height={30} color={theme.infoDecorative} />
          </View>
          <ModalHeader title={t('Info modal')} handleClose={closeSheet} />
        </View>
      }
    >
      {activeTooltip?.children ? (
        typeof activeTooltip.children === 'string' ? (
          <Text fontSize={14} appearance="secondaryText">
            {activeTooltip.children}
          </Text>
        ) : (
          activeTooltip.children
        )
      ) : null}
    </BottomSheet>
  )
}
