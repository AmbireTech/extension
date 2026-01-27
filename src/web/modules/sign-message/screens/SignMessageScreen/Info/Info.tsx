import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import HumanizerAddress from '@common/components/HumanizerAddress'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING, SPACING_SM } from '@common/styles/spacings'
import RequestingDappInfo from '@web/components/RequestingDappInfo'
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
      <RequestingDappInfo
        name={dapp?.name}
        icon={dapp?.icon}
        intentText={
          messageToSign?.content.kind === 'siwe'
            ? t('wants to prove you own this account ')
            : t('is requesting your signature ')
        }
      />
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
              style={spacings.mlMi}
            >
              {t('Will verify this signature')}
            </Text>
          </View>
        )}
    </View>
  )
}

export default React.memo(Info)
