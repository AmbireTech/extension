import React, { useEffect } from 'react'
import { View } from 'react-native'

import AmbireLogoWithBackgroundAndLogotype from '@common/assets/svg/AmbireLogoWithBackgroundAndLogotype'
import Button from '@common/components/Button'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import { selectIsPinned } from '@common/controllers/wallet-state/selectors'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import ConfettiAnimation from '@common/modules/dashboard/components/ConfettiAnimation'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import { TAB_CONTENT_WIDTH } from '@web/constants/spacings'
import useOpenWalletFromClick from '@web/hooks/useOpenWalletFromClick'
import PinExtension from '@web/modules/auth/components/PinExtension'

export const CARD_WIDTH = 400

const OnboardingCompletedScreen = () => {
  const { t } = useTranslation()
  const { openWalletFromClick, canOpenWalletFromClick } = useOpenWalletFromClick()
  const { state: isPinned, dispatch: walletStateDispatch } = useController(
    'WalletStateController',
    selectIsPinned
  )

  const { theme } = useTheme()

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
    <>
      <PinExtension />
      <TabLayoutContainer backgroundColor={theme.secondaryBackground}>
        {/* No padding of its own, so the panel starts where the other onboarding ones do.
        The pin info floats above it and needs no room reserved for it. */}
        <TabLayoutWrapperMainContent withScroll={false}>
          <Panel
            type="onboarding"
            spacingsSize="small"
            style={{ overflow: 'visible', minHeight: 520 }}
          >
            <View style={[flexbox.flex1, flexbox.alignCenter, spacings.pt3Xl]}>
              <View style={[flexbox.alignCenter, flexbox.justifyCenter]}>
                <ConfettiAnimation
                  width={TAB_CONTENT_WIDTH}
                  height={380}
                  autoPlay={false}
                  loop={false}
                />
                <AmbireLogoWithBackgroundAndLogotype />
              </View>
              <Text
                style={[spacings.mtXl, spacings.mb, text.center]}
                weight="semiBold"
                fontSize={20}
                testID="wallet-ready-to-use-text"
              >
                {t('Ambire Wallet is ready to use')}
              </Text>
              {!isPinned ? (
                <Text appearance="secondaryText" weight="medium" style={[text.center]}>
                  {t('Pin the Ambire Extension to your toolbar for easy access.')}
                </Text>
              ) : (
                <Text appearance="secondaryText" weight="medium" style={[text.center]}>
                  {t('You can access your accounts from the dashboard via the extension icon.')}
                </Text>
              )}
              {/* Firefox can't open the popup from here, but it can open the sidebar from this
              click (see useOpenWalletFromClick) */}
              {canOpenWalletFromClick && (
                <View style={{ ...flexbox.flex1, width: '100%', ...flexbox.justifyEnd }}>
                  <Button
                    testID="onboarding-completed-open-dashboard-btn"
                    text={t('Open wallet')}
                    hasBottomSpacing={false}
                    style={{ width: '100%' }}
                    onPress={openWalletFromClick}
                  />
                </View>
              )}
            </View>
          </Panel>
        </TabLayoutWrapperMainContent>
      </TabLayoutContainer>
    </>
  )
}

export default React.memo(OnboardingCompletedScreen)
