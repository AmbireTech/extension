import React, { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import InfoIcon from '@common/assets/svg/InfoIcon'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import { BOTTOM_SHEET_Z_INDEX } from '@common/components/BottomSheet/styles'
import Text from '@common/components/Text'
import { tooltipManager } from '@common/components/Tooltip/TooltipManager'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

export function GlobalTooltip() {
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

  // When the content is the same as the title, show it only once, as the title
  const hasContent = !!activeTooltip?.children && activeTooltip.children !== activeTooltip.title
  // Without content, the empty content area must not add space below the title
  const scrollViewProps = useMemo(
    () => (hasContent ? undefined : { style: spacings.mb0 }),
    [hasContent]
  )

  return (
    <BottomSheet
      id="global-tooltip-sheet"
      sheetRef={sheetRef}
      type="modal"
      customZIndex={BOTTOM_SHEET_Z_INDEX + 10}
      onClosed={() => {
        // Guard: only call hide() once per close to prevent infinite loop
        if (isClosingRef.current) return
        isClosingRef.current = true
        tooltipManager.hide()
      }}
      closeBottomSheet={closeSheet}
      scrollViewProps={scrollViewProps}
      HeaderComponent={
        <View>
          <View
            style={[
              flexbox.alignSelfCenter,
              { backgroundColor: theme.infoBackground, borderRadius: 50 },
              // Without a title there is no header to space the icon from the content
              !activeTooltip?.title && spacings.mb
            ]}
          >
            <InfoIcon width={30} height={30} color={theme.infoDecorative} />
          </View>
          {!!activeTooltip?.title && (
            <ModalHeader
              title={activeTooltip.title}
              handleClose={closeSheet}
              style={hasContent ? undefined : spacings.mbSm}
            />
          )}
        </View>
      }
    >
      {hasContent ? (
        typeof activeTooltip?.children === 'string' ? (
          <Text fontSize={14} appearance="secondaryText">
            {activeTooltip.children}
          </Text>
        ) : (
          activeTooltip?.children
        )
      ) : null}
    </BottomSheet>
  )
}
