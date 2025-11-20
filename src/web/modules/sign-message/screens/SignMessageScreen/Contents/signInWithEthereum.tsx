import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { AUTO_LOGIN_DURATION_OPTIONS } from '@ambire-common/controllers/autoLogin/autoLogin'
import { SiweMessage } from '@ambire-common/interfaces/userRequest'
import Alert from '@common/components/Alert'
import NetworkBadge from '@common/components/NetworkBadge'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Select from '@common/components/Select'
import Text from '@common/components/Text'
import Toggle from '@common/components/Toggle'
import Tooltip from '@common/components/Tooltip'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING, SPACING_LG, SPACING_MD, SPACING_SM } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useResponsiveActionWindow from '@web/hooks/useResponsiveActionWindow'
import useSignMessageControllerState from '@web/hooks/useSignMessageControllerState'
import HardwareWalletSigningModal from '@web/modules/hardware-wallet/components/HardwareWalletSigningModal'
import LedgerConnectModal from '@web/modules/hardware-wallet/components/LedgerConnectModal'
import Info from '@web/modules/sign-message/screens/SignMessageScreen/Info'
import getStyles from '@web/modules/sign-message/screens/SignMessageScreen/styles'

interface Props {
  shouldDisplayLedgerConnectModal: boolean
  isLedgerConnected: boolean
  handleDismissLedgerConnectModal: () => void
}

const Label = ({
  children,
  responsiveSizeMultiplier
}: {
  children: React.ReactNode
  responsiveSizeMultiplier: number
}) => {
  return (
    <Text weight="medium" fontSize={14 * responsiveSizeMultiplier} appearance="primaryText">
      {children}
    </Text>
  )
}

const Value = ({
  children,
  tooltipId = '',
  responsiveSizeMultiplier
}: {
  children: React.ReactNode
  tooltipId?: string
  responsiveSizeMultiplier: number
}) => {
  return (
    <Text
      appearance="secondaryText"
      fontSize={14 * responsiveSizeMultiplier}
      dataSet={{ tooltipId }}
    >
      {children}
    </Text>
  )
}

const Row = ({
  children,
  responsiveSizeMultiplier
}: {
  children: React.ReactNode
  responsiveSizeMultiplier: number
}) => {
  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.justifySpaceBetween,
        flexbox.alignCenter,
        {
          marginBottom: SPACING_SM * responsiveSizeMultiplier
        }
      ]}
    >
      {children}
    </View>
  )
}

const SignInWithEthereum = ({
  shouldDisplayLedgerConnectModal,
  isLedgerConnected,
  handleDismissLedgerConnectModal
}: Props) => {
  const { t } = useTranslation()
  const signMessageState = useSignMessageControllerState()
  const signStatus = signMessageState.statuses.sign
  const { styles } = useTheme(getStyles)
  const { theme } = useTheme()
  const { networks } = useNetworksControllerState()
  const { responsiveSizeMultiplier } = useResponsiveActionWindow()
  const { dispatch } = useBackgroundService()

  const siweMessageToSign = useMemo(() => {
    // It's validated beforehand. This component is never rendered if the
    // message is not a SIWE one.
    return signMessageState.messageToSign!.content as SiweMessage
  }, [signMessageState.messageToSign])
  const isAutoLoginEnabledByUser = siweMessageToSign?.isAutoLoginEnabledByUser || false

  const network = useMemo(
    () =>
      networks.find((n) => {
        return siweMessageToSign?.parsedMessage?.chainId
          ? n.chainId.toString() === String(siweMessageToSign.parsedMessage.chainId)
          : n.chainId === signMessageState.messageToSign?.chainId
      }),
    [networks, siweMessageToSign?.parsedMessage?.chainId, signMessageState.messageToSign?.chainId]
  )

  const rows = useMemo(() => {
    const parsedMessageContent = siweMessageToSign?.parsedMessage
    if (!parsedMessageContent) return []

    return [
      {
        label: 'URL',
        value: parsedMessageContent.uri
      },
      {
        label: 'Domain',
        value: parsedMessageContent.domain
      },
      {
        label: 'Account',
        value: parsedMessageContent.address
      },
      {
        label: 'Version',
        value: parsedMessageContent.version
      },
      {
        label: 'Chain ID',
        value: network ? `${network.chainId} (${network.name})` : parsedMessageContent.chainId
      },
      {
        label: 'Nonce',
        value: parsedMessageContent.nonce
      },
      {
        label: 'Issued',
        value: parsedMessageContent.issuedAt
          ? new Date(parsedMessageContent.issuedAt).toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : undefined
      },
      {
        label: 'Resources',
        value: parsedMessageContent.resources
      }
    ].filter((row) => !!row.value)
  }, [network, siweMessageToSign?.parsedMessage])

  const updateIsAutoLoginEnabled = useCallback(
    (enabled: boolean) => {
      dispatch({
        type: 'MAIN_CONTROLLER_SIGN_MESSAGE_UPDATE',
        params: {
          isAutoLoginEnabledByUser: enabled
        }
      })
    },
    [dispatch]
  )

  const updateAutoLoginExpirationTime = useCallback(
    (autoLoginDuration: number) => {
      dispatch({
        type: 'MAIN_CONTROLLER_SIGN_MESSAGE_UPDATE',
        params: {
          autoLoginDuration
        }
      })
    },
    [dispatch]
  )

  return (
    <TabLayoutWrapperMainContent>
      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          {
            marginBottom: SPACING_MD * responsiveSizeMultiplier
          }
        ]}
      >
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <Text weight="medium" fontSize={24 * responsiveSizeMultiplier} style={spacings.mrSm}>
            {t('Sign-in request')}
          </Text>
        </View>
        <NetworkBadge
          chainId={signMessageState.messageToSign?.chainId}
          responsiveSizeMultiplier={responsiveSizeMultiplier}
          withOnPrefix
        />
        {/* @TODO: Replace with Badge; add size prop to badge; add tooltip  */}
      </View>
      <View style={styles.container}>
        <View
          style={{
            marginBottom: SPACING_LG * responsiveSizeMultiplier
          }}
        >
          <Info />
        </View>
        <View
          style={{
            flexGrow: 0,
            flexShrink: 1
          }}
        >
          <ScrollableWrapper
            style={{
              backgroundColor: theme.primaryBackground,
              borderWidth: 1,
              borderColor: theme.secondaryBorder,
              paddingHorizontal: SPACING_SM * responsiveSizeMultiplier,
              paddingVertical: SPACING * responsiveSizeMultiplier,
              marginBottom: SPACING * responsiveSizeMultiplier,
              borderRadius: BORDER_RADIUS_PRIMARY,
              minHeight: 200
            }}
            contentContainerStyle={flexbox.flex1}
          >
            <View
              style={{
                marginBottom: SPACING_SM * responsiveSizeMultiplier
              }}
            >
              <Label responsiveSizeMultiplier={responsiveSizeMultiplier}>{t('Message')}</Label>
              <Value responsiveSizeMultiplier={responsiveSizeMultiplier}>
                {siweMessageToSign.parsedMessage.statement}
              </Value>
            </View>
            {rows.map((row) => (
              <Row responsiveSizeMultiplier={responsiveSizeMultiplier} key={row.label}>
                <Label responsiveSizeMultiplier={responsiveSizeMultiplier}>{t(row.label)}</Label>
                {row.label === 'Resources' && Array.isArray(row.value) && (
                  <View style={flexbox.alignEnd}>
                    {row.value.map((resource: string) => (
                      <Value responsiveSizeMultiplier={responsiveSizeMultiplier} key={resource}>
                        {resource}
                      </Value>
                    ))}
                  </View>
                )}
                {row.label === 'Nonce' && typeof row.value === 'string' && (
                  <>
                    <Value responsiveSizeMultiplier={responsiveSizeMultiplier} tooltipId="nonce">
                      {row.value.length > 45 ? `${row.value.slice(0, 45)}...` : row.value}
                    </Value>
                    <Tooltip
                      content={row.value}
                      id="nonce"
                      // @ts-ignore
                      style={{
                        ...flexbox.wrap,
                        ...flexbox.flex1,
                        wordBreak: 'break-all'
                      }}
                    />
                  </>
                )}
                {row.label !== 'Resources' && row.label !== 'Nonce' && (
                  <Value responsiveSizeMultiplier={responsiveSizeMultiplier}>{row.value}</Value>
                )}
              </Row>
            ))}
          </ScrollableWrapper>
        </View>

        {siweMessageToSign.autoLoginStatus !== 'unsupported' &&
          siweMessageToSign.siweValidityStatus === 'valid' && (
            <View style={[flexbox.directionRow, flexbox.justifyEnd, flexbox.alignCenter]}>
              <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifyEnd]}>
                <Toggle isOn={isAutoLoginEnabledByUser} onToggle={updateIsAutoLoginEnabled} />

                <Text
                  fontSize={14 * responsiveSizeMultiplier}
                  appearance="secondaryText"
                  style={spacings.mrSm}
                >
                  {t('Auto-login on this network for the next')}
                </Text>
              </View>
              <Select
                options={AUTO_LOGIN_DURATION_OPTIONS}
                setValue={({ value }) => {
                  updateAutoLoginExpirationTime(Number(value))
                }}
                containerStyle={{ width: 120, marginBottom: 0 }}
                size="sm"
                value={AUTO_LOGIN_DURATION_OPTIONS.find(
                  (option) =>
                    // Convert the duration to hours for comparison with the option values
                    Number(option.value) === siweMessageToSign.autoLoginDuration
                )}
                withSearch={false}
                disabled={!isAutoLoginEnabledByUser}
              />
            </View>
          )}
        {siweMessageToSign.siweValidityStatus === 'domain-mismatch' && (
          <Alert
            type="error"
            title={t('Deceptive app request')}
            text={t(
              "The app you're attempting to sign in to does not match the domain in the message. This may be a phishing attempt."
            )}
          />
        )}
        {siweMessageToSign.siweValidityStatus === 'invalid' && (
          <Alert
            type="error"
            title={t('Invalid Sign-In request')}
            text={t('The Sign-In message is invalid. Please verify its contents before signing.')}
          />
        )}
        {siweMessageToSign.siweValidityStatus === 'invalid-critical' && (
          <Alert
            type="error"
            title={t('Potentially dangerous Sign-In request')}
            text={t(
              'The Sign-In message is invalid and may pose a security risk. Please do not sign this message.'
            )}
          />
        )}
        {signMessageState.signingKeyType && signMessageState.signingKeyType !== 'internal' && (
          <HardwareWalletSigningModal
            keyType={signMessageState.signingKeyType}
            isVisible={signStatus === 'LOADING'}
          />
        )}
        {shouldDisplayLedgerConnectModal && (
          <LedgerConnectModal
            isVisible={!isLedgerConnected}
            handleOnConnect={handleDismissLedgerConnectModal}
            handleClose={handleDismissLedgerConnectModal}
            displayOptionToAuthorize={false}
          />
        )}
      </View>
    </TabLayoutWrapperMainContent>
  )
}

export default React.memo(SignInWithEthereum)
