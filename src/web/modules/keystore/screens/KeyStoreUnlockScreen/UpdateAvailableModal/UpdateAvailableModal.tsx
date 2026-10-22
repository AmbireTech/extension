import React, { useCallback } from 'react'
import { Pressable, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import CloseIcon from '@common/assets/svg/CloseIcon'
import SparklesIcon from '@common/assets/svg/SparklesIcon'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

import getStyles from './styles'

// The design draws the X 10px wide with a 1.5px stroke. The icon is drawn in a 14.121 box where its
// lines are 12 long, so a 11.7675px box makes the lines 10px and a 1.8 stroke width makes them 1.5px.
const CLOSE_ICON_SIZE = 11.7675
const CLOSE_ICON_STROKE_WIDTH = '1.8'

/**
 * Opens on its own over the lock screen and asks the user to update before unlocking.
 * Closing it leaves the lock screen usable, the update stays one tap away on the dashboard.
 */
const UpdateAvailableModal = () => {
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  const { dispatch } = useController('ExtensionUpdateController')
  const { ref: sheetRef, close: closeBottomSheet } = useModalize()

  const applyUpdate = useCallback(() => {
    dispatch({ type: 'method', params: { method: 'applyUpdate', args: [] } })
  }, [dispatch])

  return (
    <BottomSheet
      id="extension-update-modal"
      type="modal"
      autoOpen
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      style={styles.modal}
    >
      <Pressable
        testID="button-close-extension-update-modal"
        hitSlop={8}
        style={styles.closeButton}
        onPress={() => closeBottomSheet()}
      >
        <View style={styles.closeIconWrapper}>
          <CloseIcon
            width={CLOSE_ICON_SIZE}
            height={CLOSE_ICON_SIZE}
            color={theme.primaryAccent}
            strokeWidth={CLOSE_ICON_STROKE_WIDTH}
            strokeLinecap="butt"
          />
        </View>
      </Pressable>
      <View style={[flexbox.alignCenter, spacings.mb2Xl]}>
        <SparklesIcon width={36} height={36} color={theme.primaryAccent} style={spacings.mbMd} />
        <Text fontSize={20} weight="medium" color={theme.neutral800} style={text.center}>
          {t('New version available')}
        </Text>
        <Text fontSize={14} appearance="secondaryText" style={[text.center, spacings.mtMi]}>
          {t('Update Ambire to the newest version before unlocking your wallet.')}
        </Text>
      </View>
      <Button
        testID="button-apply-extension-update"
        text={t('Update now')}
        hasBottomSpacing={false}
        style={styles.updateButton}
        onPress={applyUpdate}
      />
    </BottomSheet>
  )
}

export default React.memo(UpdateAvailableModal)
