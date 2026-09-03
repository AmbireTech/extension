import React, { useCallback, useState } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import AmbireLogoWithBackgroundAndLogotype from '@common/assets/svg/AmbireLogoWithBackgroundAndLogotype'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import { AllControllersMappingType } from '@common/constants/controllersMapping'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'
import InviteCodeInput, { INVITE_CODE_LENGTH } from '@mobile/modules/invite/components/InviteCodeInput'

const selectIsVerifying = (state: AllControllersMappingType['InviteController']) =>
  state.statuses.verify === 'LOADING'

const InviteVerifyScreen = () => {
  const { t } = useTranslation()
  const { state: isVerifying, dispatch } = useController('InviteController', selectIsVerifying)
  const [code, setCode] = useState('')

  const { ref: helpSheetRef, open: openHelpSheet, close: closeHelpSheet } = useModalize()

  const handleOpenHelpSheet = useCallback(() => openHelpSheet(), [openHelpSheet])

  const isCodeComplete = code.length === INVITE_CODE_LENGTH

  const handleSubmit = useCallback(() => {
    if (!isCodeComplete || isVerifying) return

    dispatch({ type: 'method', params: { method: 'verify', args: [code] } })
  }, [code, isCodeComplete, isVerifying, dispatch])

  return (
    <MobileLayoutContainer
      footer={
        <>
          <Button
            testID="verify-invite-code-btn"
            type="primary"
            text={isVerifying ? t('Unlocking...') : t('Unlock access')}
            disabled={!isCodeComplete || isVerifying}
            onPress={handleSubmit}
            style={[spacings.mbLg, spacings.mtLg]}
          />
          <Text fontSize={16} appearance="secondaryText" style={text.center}>
            {t('Already an Ambire user?')}
            {'\n'}
            <Text fontSize={16} appearance="secondaryText" underline onPress={handleOpenHelpSheet}>
              {t('Get mobile access.')}
            </Text>
          </Text>
        </>
      }
    >
      <MobileLayoutWrapperMainContent withScroll>
        <View style={[flexbox.alignCenter, spacings.mtXl, spacings.mbXl]}>
          <AmbireLogoWithBackgroundAndLogotype />
        </View>
        <Text fontSize={24} weight="medium" style={[text.center, spacings.mbTy]}>
          {t('Enter your invite code')}
        </Text>
        <Text fontSize={16} appearance="secondaryText" style={[text.center, spacings.mb2Xl]}>
          {t('Ambire Mobile is currently invite-only. Enter your code to get started.')}
        </Text>
        <InviteCodeInput
          value={code}
          onChange={setCode}
          onSubmitEditing={handleSubmit}
          editable={!isVerifying}
        />
      </MobileLayoutWrapperMainContent>

      <BottomSheet id="invite-code-help" sheetRef={helpSheetRef} closeBottomSheet={closeHelpSheet}>
        <ModalHeader handleClose={closeHelpSheet} title={t('How to get mobile access?')} />
        <Text fontSize={16} appearance="secondaryText">
          {t(
            'You can find your invite code by clicking on the "Ambire Mobile" banner in the browser extension dashboard.'
          )}
        </Text>
      </BottomSheet>
    </MobileLayoutContainer>
  )
}

export default React.memo(InviteVerifyScreen)
