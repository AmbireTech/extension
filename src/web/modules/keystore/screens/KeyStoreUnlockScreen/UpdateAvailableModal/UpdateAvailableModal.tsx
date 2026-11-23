import React, { useCallback } from 'react'
import { View } from 'react-native'

import SparklesIcon from '@common/assets/svg/SparklesIcon'
import BottomSheet from '@common/components/BottomSheet'
import SheetHeaderRow from '@common/components/BottomSheet/SheetHeaderRow'
import useSheetRef from '@common/components/BottomSheet/useSheetRef'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

import getStyles from './styles'

/**
 * Opens on its own over the lock screen and asks the user to update before unlocking.
 * Closing it leaves the lock screen usable, the update stays one tap away on the dashboard.
 */
const UpdateAvailableModal = () => {
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  const { dispatch } = useController('ExtensionUpdateController')
  const { ref: sheetRef, close: closeBottomSheet } = useSheetRef()

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
      backgroundColor="primaryAccent100"
      style={styles.modal}
    >
      {/* Just the sheet's X, floating over the top of the card */}
      <SheetHeaderRow />
      <View style={styles.content}>
        <View style={[flexbox.alignCenter, spacings.mb2Xl]}>
          <View style={spacings.mbMd}>
            <SparklesIcon width={36} height={36} />
          </View>
          <Text
            fontSize={20}
            weight="medium"
            color={theme.neutral800}
            style={[text.center, styles.title]}
          >
            {t('New version available')}
          </Text>
          <Text
            fontSize={14}
            appearance="secondaryText"
            style={[text.center, spacings.mtMi, styles.description]}
          >
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
      </View>
    </BottomSheet>
  )
}

export default React.memo(UpdateAvailableModal)
