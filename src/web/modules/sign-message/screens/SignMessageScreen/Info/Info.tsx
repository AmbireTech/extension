import React, { FC } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Image, Linking, View } from 'react-native'

import { ENTRY_POINT_AUTHORIZATION_REQUEST_ID } from '@ambire-common/libs/userOperation/userOperation'
import DAppsIcon from '@common/assets/svg/DAppsIcon'
import Address from '@common/components/Address'
import NetworkBadge from '@common/components/NetworkBadge'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useSignMessageControllerState from '@web/hooks/useSignMessageControllerState'

import getStyles from './styles'

interface Props {
  kindOfMessage?: 'typedMessage' | 'message'
}

const linkToSupportPage = () => {
  Linking.openURL('https://help.ambire.com/hc/en-us').catch(console.log)
}

const BoldText = ({ children }: { children: string }) => {
  const { maxWidthSize } = useWindowSize()

  return (
    <Text appearance="secondaryText" fontSize={maxWidthSize('xl') ? 16 : 14} weight="semiBold">
      {children}
    </Text>
  )
}

const Info: FC<Props> = () => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const { maxWidthSize } = useWindowSize()
  const { dapp, messageToSign } = useSignMessageControllerState()

  return (
    <View style={[styles.container, maxWidthSize('xl') ? spacings.mbXl : spacings.mbMd]}>
      {(!messageToSign || messageToSign.fromActionId !== ENTRY_POINT_AUTHORIZATION_REQUEST_ID) && (
        <View style={spacings.mbMd}>
          {dapp?.icon ? (
            <Image source={{ uri: dapp?.icon }} style={styles.image} resizeMode="contain" />
          ) : (
            <View style={styles.fallbackIcon}>
              <DAppsIcon style={{ width: '100%', height: '100%' }} />
            </View>
          )}
          <View style={[flexbox.flex1, spacings.ptSm]}>
            <Text
              fontSize={maxWidthSize('xl') ? 20 : 16}
              appearance="secondaryText"
              weight="semiBold"
            >
              {dapp?.name || t('The dApp')}
            </Text>
            <Text fontSize={maxWidthSize('xl') ? 16 : 14} appearance="secondaryText">
              {t('is requesting your signature ')}
            </Text>
          </View>
        </View>
      )}
      {messageToSign?.content?.kind === 'typedMessage' &&
        messageToSign?.fromActionId !== ENTRY_POINT_AUTHORIZATION_REQUEST_ID &&
        messageToSign?.content?.domain?.verifyingContract &&
        typeof messageToSign?.content?.domain?.verifyingContract === 'string' && (
          <View style={styles.verifyingContract}>
            <Address
              fontSize={maxWidthSize('xl') ? 14 : 12}
              style={{ maxWidth: '100%' }}
              address={messageToSign.content.domain.verifyingContract}
              explorerNetworkId={messageToSign.networkId}
            />
            <Text fontSize={12} appearance="secondaryText">
              {t('Will verify this signature')}
            </Text>
          </View>
        )}

      {(!messageToSign || messageToSign.fromActionId === ENTRY_POINT_AUTHORIZATION_REQUEST_ID) && (
        <>
          <Text
            style={spacings.mbMd}
            fontSize={maxWidthSize('xl') ? 24 : 20}
            appearance="secondaryText"
            weight="medium"
          >
            {t('Entry point authorization')}
          </Text>
          <NetworkBadge withOnPrefix style={spacings.mbMd} networkId={messageToSign?.networkId} />
          <Trans t={t}>
            <Text
              appearance="secondaryText"
              fontSize={maxWidthSize('xl') ? 16 : 14}
              style={spacings.mbMd}
            >
              This is your <BoldText>first smart account transaction on this network</BoldText>. To
              proceed, you must <BoldText>grant privileges</BoldText> to a smart contract called{' '}
              <BoldText>&quot;Entry Point&quot;</BoldText>, which is responsible for{' '}
              <BoldText>safely executing smart account transactions</BoldText>. This is a normal
              procedure ; we request all smart account users to grant these permissions{' '}
              <BoldText>upon first network interaction</BoldText>.
            </Text>
          </Trans>
          <Text fontSize={maxWidthSize('xl') ? 16 : 14} appearance="secondaryText">
            {t('If you still have any doubts, please ')}
            <Text
              fontSize={maxWidthSize('xl') ? 16 : 14}
              style={{ color: theme.primary, textDecorationLine: 'underline' }}
              onPress={linkToSupportPage}
            >
              {t('contact support.')}
            </Text>
          </Text>
        </>
      )}
    </View>
  )
}

export default React.memo(Info)
