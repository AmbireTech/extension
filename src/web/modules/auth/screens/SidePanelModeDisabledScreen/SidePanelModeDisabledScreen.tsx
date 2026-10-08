import React, { useCallback } from 'react'
import { View } from 'react-native'

import SidePanelIcon from '@common/assets/svg/SidePanelIcon'
import Button from '@common/components/Button'
import LayoutWrapper from '@common/components/LayoutWrapper'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

/**
 * Shown instead of the wallet when the Firefox sidebar is opened (e.g. from Firefox's sidebar
 * switcher, which always lists the extension) while side panel mode is off.
 */
const SidePanelModeDisabledScreen = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { dispatch: walletStateDispatch } = useController('WalletStateController')

  const enableSidePanelMode = useCallback(() => {
    walletStateDispatch({
      type: 'method',
      params: {
        method: 'setSidePanelModeEnabled',
        args: [true]
      }
    })
  }, [walletStateDispatch])

  return (
    <LayoutWrapper>
      {/* Centered in the panel, like the "make the sidebar wider" notice (SidePanelTooNarrowOverlay) */}
      <View style={[flexbox.flex1, flexbox.center, spacings.ph]}>
        <SidePanelIcon width={48} height={48} color={theme.primaryText} />
        <Text fontSize={20} weight="medium" style={[spacings.mtMd, text.center]}>
          {t('Side panel mode is off')}
        </Text>
        <Text
          fontSize={16}
          weight="regular"
          appearance="secondaryText"
          style={[spacings.mtTy, text.center]}
        >
          {t(
            'Ambire currently opens as a popup from the toolbar. Turn on side panel mode to use the wallet here instead.'
          )}
        </Text>
        <Button
          type="primary"
          text={t('Turn on side panel mode')}
          onPress={enableSidePanelMode}
          hasBottomSpacing={false}
          style={[spacings.mtLg, { alignSelf: 'center', minWidth: 180 }]}
        />
      </View>
    </LayoutWrapper>
  )
}

export default React.memo(SidePanelModeDisabledScreen)
