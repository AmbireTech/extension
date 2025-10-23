import React, { FC } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Image, Linking, View } from 'react-native'

import { ENTRY_POINT_AUTHORIZATION_REQUEST_ID } from '@ambire-common/libs/userOperation/userOperation'
import DAppsIcon from '@common/assets/svg/DAppsIcon'
import HumanizerAddress from '@common/components/HumanizerAddress'
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
    <View>
      {(!messageToSign ||
        (messageToSign.fromActionId !== ENTRY_POINT_AUTHORIZATION_REQUEST_ID &&
          messageToSign.content.kind !== 'authorization-7702')) && (
        <View style={[flexbox.directionRow, spacings.mb]}>
          {dapp?.icon ? (
            <Image source={{ uri: dapp?.icon }} style={styles.image} resizeMode="contain" />
          ) : (
            <View style={styles.fallbackIcon}>
              <DAppsIcon style={{ width: '100%', height: '100%' }} />
            </View>
          )}
          <View style={[flexbox.flex1, spacings.mlSm]}>
            <Text
              fontSize={maxWidthSize('xl') ? 20 : 16}
              appearance="secondaryText"
              weight="semiBold"
            >
              {dapp?.name || t('The App')}
            </Text>
            <Text fontSize={maxWidthSize('xl') ? 16 : 14} appearance="secondaryText">
              {messageToSign?.content.kind === 'siwe'
                ? t('wants to prove you own this account ')
                : t('is requesting your signature ')}
            </Text>
          </View>
        </View>
      )}
      {messageToSign?.content?.kind === 'typedMessage' &&
        messageToSign?.fromActionId !== ENTRY_POINT_AUTHORIZATION_REQUEST_ID &&
        messageToSign?.content?.domain?.verifyingContract &&
        typeof messageToSign?.content?.domain?.verifyingContract === 'string' && (
          <View style={styles.verifyingContract}>
            <HumanizerAddress
              fontSize={14}
              style={{ maxWidth: '100%' }}
              address={messageToSign.content.domain.verifyingContract}
              chainId={messageToSign.chainId}
            />
            <Text fontSize={14} appearance="secondaryText" style={spacings.mlTy}>
              {t('Will verify this signature')}
            </Text>
          </View>
        )}

      {(!messageToSign || messageToSign.fromActionId === ENTRY_POINT_AUTHORIZATION_REQUEST_ID) && (
        <>
          <Text
            style={spacings.mb}
            fontSize={maxWidthSize('xl') ? 24 : 20}
            appearance="secondaryText"
            weight="medium"
          >
            {t('Entry point authorization')}
          </Text>
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

      {messageToSign && messageToSign.content.kind === 'authorization-7702' && (
        <>
          <Text
            style={spacings.mbMd}
            fontSize={maxWidthSize('xl') ? 24 : 20}
            appearance="secondaryText"
            weight="medium"
          >
            {t('EIP-7702 authorization')}
          </Text>
          <Trans t={t}>
            <Text
              appearance="secondaryText"
              fontSize={maxWidthSize('xl') ? 16 : 14}
              style={spacings.mbMd}
            >
              You are signing an authorization that is going to make your EOA account Smarter,
              meaning you will be able to use Smart Account functionalities.
            </Text>
          </Trans>
          <Text fontSize={maxWidthSize('xl') ? 16 : 14} appearance="secondaryText">
            {t('If you are unsure or worried for any reason, please ')}
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
