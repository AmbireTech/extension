import React from 'react'
import { Image, View } from 'react-native'

import ExtensionsIcon from '@common/assets/svg/ExtensionsIcon'
import PinIcon from '@common/assets/svg/PinIcon'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import AmbireIcon from '@web/assets/images/xicon@128.png'
import { engine } from '@web/constants/browserapi'

import getStyles from './styles'

// Distance from the right edge of the window, so the card sits under the toolbar icon it
// points at - the same on every browser and whether the extension is pinned or not
const RIGHT_OFFSET = 32

const PinExtension = () => {
  const { t } = useTranslation()
  const { isPinned } = useController('WalletStateController').state
  const { styles } = useTheme(getStyles)

  return (
    <View style={[styles.pinExtensionContainer, { right: RIGHT_OFFSET }]}>
      <Image source={AmbireIcon as any} style={{ width: 80, height: 80 }} />
      {!isPinned ? (
        <View style={spacings.ph}>
          <Text fontSize={16} weight="semiBold" style={spacings.mbMi}>
            {t('Pin the Ambire extension')}
          </Text>
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <Text appearance="secondaryText" weight="medium">
              {t('click')}
            </Text>
            <ExtensionsIcon style={spacings.phTy} width={21} height={21} />
            <Text appearance="secondaryText" weight="medium">
              {t('and then')}
            </Text>
            {engine === 'gecko' ? (
              <SettingsIcon style={{ marginHorizontal: 6 }} />
            ) : (
              <PinIcon style={spacings.phMi} />
            )}
          </View>
        </View>
      ) : (
        <View style={spacings.ph}>
          <Text fontSize={16} weight="medium" appearance="secondaryText">
            {t('Open Ambire from your browser toolbar.')}
          </Text>
        </View>
      )}
    </View>
  )
}

export default React.memo(PinExtension)
