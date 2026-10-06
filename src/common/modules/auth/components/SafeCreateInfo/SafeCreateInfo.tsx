import React, { useMemo } from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'
import { useModalize } from 'react-native-modalize'

import InformationIcon from '@common/assets/svg/InformationIcon'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const MODAL_MAX_WIDTH = 460

type Props = {
  /** Positions the "How does this work?" link, e.g. to center it under a centered subtitle */
  style?: StyleProp<ViewStyle>
}

/**
 * A "How does this work?" link that opens a modal (a bottom sheet on mobile) explaining the Safe setup in plain
 * language. Not tooltips, because they don't work on mobile.
 */
const SafeCreateInfo = ({ style }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()

  const sections = useMemo(
    () => [
      {
        key: 'owners',
        title: t('Owners'),
        text: t(
          'Owners are the wallets that control this account. They can be accounts you already have in Ambire, a hardware wallet, or the address of someone you trust.'
        )
      },
      {
        key: 'required-confirmations',
        title: t('Required confirmations'),
        text: t(
          'This is how many owners must approve before a transaction is sent. For example, with 2 of 3, losing one key won’t lock you out, and no single key can move funds on its own.'
        )
      }
    ],
    [t]
  )

  return (
    <>
      <HoverablePressable
        onPress={openBottomSheet as () => void}
        style={[flexbox.directionRow, flexbox.alignCenter, style]}
        testID="safe-create-info-button"
      >
        <InformationIcon width={14} height={14} color={theme.linkText} />
        <Text fontSize={14} appearance="linkText" style={spacings.mlMi}>
          {t('How does this work?')}
        </Text>
      </HoverablePressable>

      <BottomSheet
        id="safe-create-info"
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
        // A centered modal on web, a bottom sheet on mobile
        style={isWeb ? { maxWidth: MODAL_MAX_WIDTH } : undefined}
        withBackdropBlur
        isScrollEnabled={false}
        adjustToContentHeight
      >
        <ModalHeader title={t('How Safe accounts work')} handleClose={closeBottomSheet} />
        {sections.map(({ key, title, text }) => (
          <View key={key} style={spacings.mtMd}>
            <Text fontSize={16} weight="semiBold" style={spacings.mbTy}>
              {title}
            </Text>
            <Text fontSize={14} appearance="secondaryText">
              {text}
            </Text>
          </View>
        ))}
      </BottomSheet>
    </>
  )
}

export default React.memo(SafeCreateInfo)
