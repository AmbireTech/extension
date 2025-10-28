import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, View } from 'react-native'

import DAppsIcon from '@common/assets/svg/DAppsIcon'
import HumanizerAddress from '@common/components/HumanizerAddress'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING, SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useResponsiveActionWindow from '@web/hooks/useResponsiveActionWindow'
import useSignMessageControllerState from '@web/hooks/useSignMessageControllerState'

import getStyles from './styles'

interface Props {
  kindOfMessage?: 'typedMessage' | 'message'
}

const Info: FC<Props> = () => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const { dapp, messageToSign } = useSignMessageControllerState()
  const { responsiveSizeMultiplier } = useResponsiveActionWindow()

  return (
    <View>
      <View style={flexbox.directionRow}>
        {dapp?.icon ? (
          <Image
            source={{ uri: dapp?.icon }}
            style={{
              ...styles.image,
              width: 48 * responsiveSizeMultiplier,
              height: 48 * responsiveSizeMultiplier
            }}
            resizeMode="contain"
          />
        ) : (
          <View
            style={{
              ...styles.fallbackIcon,
              width: 48 * responsiveSizeMultiplier,
              height: 48 * responsiveSizeMultiplier
            }}
          >
            <DAppsIcon style={{ width: '100%', height: '100%' }} />
          </View>
        )}
        <View style={[flexbox.flex1, spacings.mlSm]}>
          <Text
            fontSize={16 * responsiveSizeMultiplier}
            appearance="secondaryText"
            weight="semiBold"
          >
            {dapp?.name || t('The App')}
          </Text>
          <Text fontSize={14 * responsiveSizeMultiplier} appearance="secondaryText">
            {messageToSign?.content.kind === 'siwe'
              ? t('wants to prove you own this account ')
              : t('is requesting your signature ')}
          </Text>
        </View>
      </View>
      {messageToSign?.content?.kind === 'typedMessage' &&
        messageToSign?.content?.domain?.verifyingContract &&
        typeof messageToSign?.content?.domain?.verifyingContract === 'string' && (
          <View
            style={{
              ...styles.verifyingContract,
              paddingVertical: SPACING_SM * responsiveSizeMultiplier,
              paddingHorizontal: SPACING * responsiveSizeMultiplier
            }}
          >
            <HumanizerAddress
              fontSize={14 * responsiveSizeMultiplier}
              style={{ maxWidth: '100%' }}
              address={messageToSign.content.domain.verifyingContract}
              chainId={messageToSign.chainId}
            />
            <Text
              fontSize={14 * responsiveSizeMultiplier}
              appearance="secondaryText"
              style={{
                marginBottom: SPACING_TY * responsiveSizeMultiplier
              }}
            >
              {t('Will verify this signature')}
            </Text>
          </View>
        )}
    </View>
  )
}

export default React.memo(Info)
