import React, { useEffect } from 'react'
import { View } from 'react-native'

import KeyStoreIcon from '@common/assets/svg/KeyStoreIcon'
import Button from '@common/components/Button'
import LottieView from '@common/components/LottieView'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import { selectIsPinned } from '@common/controllers/wallet-state/selectors'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import useOpenWalletFromClick from '@web/hooks/useOpenWalletFromClick'
import PasswordResetCompletedAnimation from '@web/modules/keystore/components/KeyStoreSetNewPasswordCompleted/password-reset-completed-animation.json'

export const CARD_WIDTH = 400

const KeyStoreSetNewPasswordCompleted = () => {
  const { t } = useTranslation()
  const { openWalletFromClick, canOpenWalletFromClick } = useOpenWalletFromClick()
  const { state: isPinned, dispatch: walletStateDispatch } = useController(
    'WalletStateController',
    selectIsPinned
  )

  useEffect(() => {
    walletStateDispatch({
      type: 'method',
      params: {
        method: 'setIsSetupComplete',
        args: [true]
      }
    })
  }, [walletStateDispatch])

  return (
    <View style={[flexbox.flex1, flexbox.alignCenter]}>
      <View
        style={[
          flexbox.alignCenter,
          flexbox.justifyCenter,
          spacings.mb,
          { width: 200, height: 180 }
        ]}
      >
        <LottieView
          animationData={PasswordResetCompletedAnimation}
          style={{
            width: 200,
            height: 180,
            alignSelf: 'center',
            position: 'absolute',
            pointerEvents: 'none'
          }}
        />
        <KeyStoreIcon />
      </View>
      <Text style={[spacings.mtLg, spacings.mb, text.center]} weight="semiBold" fontSize={16}>
        {t('Your new extension password is set!')}
      </Text>
      {!isPinned ? (
        <Text fontSize={16} appearance="secondaryText" weight="medium" style={[text.center]}>
          {t('Pin the Ambire Extension to your toolbar for easy access.')}
        </Text>
      ) : (
        <Text fontSize={16} appearance="secondaryText" weight="medium" style={[text.center]}>
          {t('You can access your dashboard via the extension icon.')}
        </Text>
      )}
      {/* Firefox can't open the popup from here, but it can open the sidebar from this click (see
      useOpenWalletFromClick) */}
      {canOpenWalletFromClick && (
        <View style={[flexbox.flex1, flexbox.justifyEnd]}>
          <Button
            testID="onboarding-completed-open-dashboard-btn"
            text={t('Open dashboard')}
            hasBottomSpacing={false}
            onPress={openWalletFromClick}
          />
        </View>
      )}
    </View>
  )
}

export default React.memo(KeyStoreSetNewPasswordCompleted)
