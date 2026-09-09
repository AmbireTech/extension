import React, { useCallback, useState } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import AmbireLogoWithBackgroundAndLogotype from '@common/assets/svg/AmbireLogoWithBackgroundAndLogotype'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { isDev, isTesting } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import { AllControllersMappingType } from '@common/constants/controllersMapping'
import { DISCORD_URL, TELEGRAM_URL, TWITTER_URL } from '@common/constants/social'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { openInTab } from '@common/utils/links'
import { DEFAULT_INVITE_CODE_DEV } from '@env'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'
import InviteCodeInput, {
  INVITE_CODE_LENGTH,
  sanitizeInviteCode
} from '@mobile/modules/invite/components/InviteCodeInput'

const selectIsVerifying = (state: AllControllersMappingType['InviteController']) =>
  state.statuses.verify === 'LOADING'

const selectErrorMessage = (state: AllControllersMappingType['InviteController']) =>
  state.errorMessage

const InviteVerifyScreen = () => {
  const { t } = useTranslation()
  const { state: isVerifying, dispatch } = useController('InviteController', selectIsVerifying)
  const { state: errorMessage } = useController('InviteController', selectErrorMessage)
  const [code, setCode] = useState(
    // Typing the invite code on every dev build gets tedious fast, so let devs pin theirs in .env
    isDev && !isTesting ? sanitizeInviteCode(DEFAULT_INVITE_CODE_DEV ?? '') : ''
  )

  const handleCodeChange = useCallback(
    (nextCode: string) => {
      setCode(nextCode)

      if (errorMessage)
        dispatch({ type: 'method', params: { method: 'resetErrorState', args: [] } })
    },
    [dispatch, errorMessage]
  )

  const { ref: helpSheetRef, open: openHelpSheet, close: closeHelpSheet } = useModalize()

  const handleOpenHelpSheet = useCallback(() => openHelpSheet(), [openHelpSheet])

  const handleCloseHelpSheet = useCallback(() => closeHelpSheet(), [closeHelpSheet])

  const handleOpenTwitter = useCallback(() => openInTab({ url: TWITTER_URL }), [])
  const handleOpenTelegram = useCallback(() => openInTab({ url: TELEGRAM_URL }), [])
  const handleOpenDiscord = useCallback(() => openInTab({ url: DISCORD_URL }), [])

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
            style={spacings.mbLg}
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
          onChange={handleCodeChange}
          onSubmitEditing={handleSubmit}
          editable={!isVerifying}
          error={errorMessage}
        />
      </MobileLayoutWrapperMainContent>

      <BottomSheet id="invite-code-help" sheetRef={helpSheetRef} closeBottomSheet={closeHelpSheet}>
        <ModalHeader handleClose={closeHelpSheet} title={t('How to get mobile access?')} />
        <Text fontSize={16} appearance="secondaryText" style={spacings.mbLg}>
          {t(
            "We’re rolling out our mobile app in waves, starting with longtime extension users. If you're in, your code is ready."
          )}
        </Text>
        <Text fontSize={16} weight="medium" style={spacings.mb}>
          {t('1. Open the Ambire extension on your computer.')}
        </Text>
        <Text fontSize={16} weight="medium" style={spacings.mb}>
          {t('2. Click the "Ambire Mobile" banner on the dashboard.')}
        </Text>
        <Text fontSize={16} weight="medium" style={spacings.mbLg}>
          {t('3. Copy the code it shows you and enter it here.')}
        </Text>
        <Text fontSize={16} appearance="secondaryText" style={spacings.mbLg}>
          {t('No banner there yet? Your turn is coming. Want in sooner? Ping us on')}{' '}
          <Text fontSize={16} appearance="secondaryText" underline onPress={handleOpenTwitter}>
            {t('X (formerly Twitter)')}
          </Text>
          {', '}
          <Text fontSize={16} appearance="secondaryText" underline onPress={handleOpenTelegram}>
            {t('Telegram')}
          </Text>{' '}
          {t('or')}{' '}
          <Text fontSize={16} appearance="secondaryText" underline onPress={handleOpenDiscord}>
            {t('Discord')}
          </Text>
          {'.'}
        </Text>
        <Button
          type="secondary"
          text={t('Got it')}
          onPress={handleCloseHelpSheet}
          hasBottomSpacing={false}
        />
      </BottomSheet>
    </MobileLayoutContainer>
  )
}

export default React.memo(InviteVerifyScreen)
