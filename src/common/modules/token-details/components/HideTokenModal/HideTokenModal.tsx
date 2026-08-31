import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import Checkbox from '@common/components/Checkbox'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

const HideTokenModal = ({
  handleClose,
  handleHideToken,
  modalRef
}: {
  handleClose: () => void
  handleHideToken: (doNotShowModalAgain: boolean) => Promise<void>
  modalRef: any
}) => {
  const { styles, theme } = useTheme(getStyles)
  const [doNotShowModalAgain, setDoNotShowModalAgain] = useState(false)
  const { addToast } = useToast()
  const { t } = useTranslation()

  return (
    <BottomSheet
      sheetRef={modalRef}
      // id="confirm-password-bottom-sheet"
      type={isWeb ? 'modal' : 'bottom-sheet'}
      closeBottomSheet={handleClose}
      scrollViewProps={isWeb ? { contentContainerStyle: { flex: 1 } } : undefined}
      containerInnerWrapperStyles={isWeb ? { flex: 1 } : undefined}
      style={isWeb ? styles.modal : undefined}
    >
      <Text testID="hide-token-modal-title" style={spacings.mbSm} weight="semiBold">
        {t('Are you sure you want to hide this token?')}
      </Text>
      <Text testID="hide-token-modal-description">
        {t('You can always unhide it from the Settings menu > Custom tokens.')}
      </Text>

      <Pressable
        onPress={() => setDoNotShowModalAgain(!doNotShowModalAgain)}
        style={[spacings.mt2Xl, flexbox.directionRow, flexbox.alignSelfStart]}
      >
        <Checkbox onValueChange={() => {}} value={doNotShowModalAgain} />
        <Text style={{ color: theme.secondaryText }}>{t("Don't ask me again")}</Text>
      </Pressable>

      <View
        style={[
          spacings.mtLg,
          flexbox.directionRow,
          flexbox.justifySpaceBetween,
          { columnGap: SPACING_TY }
        ]}
      >
        <Button
          text={t('Cancel')}
          type="tertiary"
          onPress={handleClose}
          style={isWeb ? undefined : flexbox.flex1}
        />
        <Button
          testID="yes-hide-it-text"
          type="primary"
          text={t('Yes, hide it!')}
          style={isWeb ? undefined : flexbox.flex1}
          onPress={() => {
            handleHideToken(doNotShowModalAgain).catch(() =>
              addToast('Failed to hide token. Please refresh and try again.', { type: 'error' })
            )
          }}
        />
      </View>
    </BottomSheet>
  )
}

export default React.memo(HideTokenModal)
