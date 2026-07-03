import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { AUTO_LOGIN_DURATION_OPTIONS } from '@ambire-common/consts/autoLogin'
import { QrRequest } from '@ambire-common/interfaces/keystore'
import { SiweMessageUserRequest } from '@ambire-common/interfaces/userRequest'
import Alert from '@common/components/Alert'
import FatToggle from '@common/components/FatToggle'
import NetworkBadge from '@common/components/NetworkBadge'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Select from '@common/components/Select'
import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'
import { isMobile, isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useResponsiveActionWindow from '@common/hooks/useResponsiveActionWindow'
import useTheme from '@common/hooks/useTheme'
import HardwareWalletSigningModal from '@common/modules/hardware-wallets/components/HardwareWalletSigningModal'
import Info from '@common/modules/sign-message/components/Info'
import spacings, { SPACING, SPACING_LG, SPACING_MD, SPACING_SM } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { MobileLayoutWrapperMainContent } from '@mobile/components/MobileLayoutWrapper'
import { TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'
import LedgerConnectModal from '@web/modules/hardware-wallet/components/LedgerConnectModal'
import { QrSigningStep } from '@web/modules/hardware-wallet/qr/types'
import QrSigningFlowScreen from '@web/modules/hardware-wallet/screens/QrSigningFlowScreen'
import getStyles from '@web/modules/sign-message/screens/SignMessageScreen/styles'

interface Props {
  shouldDisplayLedgerConnectModal: boolean
  isLedgerConnected: boolean
  handleDismissLedgerConnectModal: () => void
  isSafeNotDeployed: boolean
  currentRequest: QrRequest | null
  signingStep: QrSigningStep
  handleOnContinue: () => void
  handleSubmitSignatureResponse: (payload: string | Uint8Array) => void
  handleQrSigningFlowOnRejectPressed: () => void
  handleQrSigningFlowOnBackPressed: () => void
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
      fontSize={isMobile ? 12 : 14 * responsiveSizeMultiplier}
      dataSet={{ tooltipId }}
      numberOfLines={1}
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
        isWeb && flexbox.directionRow,
        isWeb && flexbox.justifySpaceBetween,
        isWeb && flexbox.alignCenter,
        {
          marginBottom: SPACING_SM * responsiveSizeMultiplier
        }
      ]}
    >
      {children}
    </View>
  )
}

const Container = ({ children }: { children: React.ReactNode }) => {
  if (isMobile)
    return (
      <MobileLayoutWrapperMainContent contentContainerStyle={spacings.ph0}>
        {children}
      </MobileLayoutWrapperMainContent>
    )
  return <TabLayoutWrapperMainContent style={spacings.mbLg}>{children}</TabLayoutWrapperMainContent>
}

const SignInWithEthereum = ({
  shouldDisplayLedgerConnectModal,
  isLedgerConnected,
  handleDismissLedgerConnectModal,
  isSafeNotDeployed,
  currentRequest,
  signingStep,
  handleOnContinue,
  handleSubmitSignatureResponse,
  handleQrSigningFlowOnRejectPressed,
  handleQrSigningFlowOnBackPressed
}: Props) => {
  const { t } = useTranslation()
  const { state: signMessageState, dispatch: signMessageDispatch } =
    useController('SignMessageController')
  const signStatus = signMessageState.statuses.sign
  const { styles } = useTheme(getStyles)
  const { theme } = useTheme()
  const { networks } = useController('NetworksController').state
  const { responsiveSizeMultiplier } = useResponsiveActionWindow()

  const siweMessageToSign = useMemo(() => {
    // It's validated beforehand. This component is never rendered if the
    // message is not a SIWE one.
    return signMessageState.messageToSign!.content as SiweMessageUserRequest['meta']['params']
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
      signMessageDispatch({
        type: 'method',
        params: {
          method: 'update',
          args: [{ isAutoLoginEnabledByUser: enabled }]
        }
      })
    },
    [signMessageDispatch]
  )

  const updateAutoLoginExpirationTime = useCallback(
    (autoLoginDuration: number) => {
      signMessageDispatch({
        type: 'method',
        params: {
          method: 'update',
          args: [{ autoLoginDuration }]
        }
      })
    },
    [signMessageDispatch]
  )

  return (
    <Container>
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
          <Text
            weight="medium"
            fontSize={isMobile ? 20 : 24 * responsiveSizeMultiplier}
            style={spacings.mrSm}
          >
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
        <View style={isMobile ? { flex: 1 } : { flexGrow: 0, flexShrink: 1 }}>
          <ScrollableWrapper
            style={{
              backgroundColor: theme.secondaryBackground,
              paddingHorizontal: SPACING_SM * responsiveSizeMultiplier,
              paddingVertical: SPACING * responsiveSizeMultiplier,
              marginBottom: SPACING * responsiveSizeMultiplier,
              borderRadius: BORDER_RADIUS_PRIMARY,
              minHeight: 200
            }}
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
                  <View style={isWeb && flexbox.alignEnd}>
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
            <View
              style={[
                isWeb && flexbox.directionRow,
                isWeb && flexbox.justifyEnd,
                isWeb && flexbox.alignCenter
              ]}
            >
              <View
                style={[
                  flexbox.directionRow,
                  flexbox.alignCenter,
                  isWeb && flexbox.justifyEnd,
                  isMobile && spacings.mbSm
                ]}
              >
                <FatToggle
                  isOn={isAutoLoginEnabledByUser}
                  onToggle={updateIsAutoLoginEnabled}
                  width={36}
                  height={20}
                />

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
                containerStyle={
                  isMobile ? { width: '100%', marginBottom: 0 } : { width: 120, marginBottom: 0 }
                }
                size={isMobile ? 'md' : 'sm'}
                value={AUTO_LOGIN_DURATION_OPTIONS.find(
                  (option) =>
                    // Convert the duration to hours for comparison with the option values
                    Number(option.value) === siweMessageToSign.autoLoginDuration
                )}
                selectStyle={{ backgroundColor: theme.secondaryBackground }}
                withSearch={false}
                bottomSheetTitle="Auto-login period"
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
        {isSafeNotDeployed && (
          <Alert
            type="error"
            title="Safe account not enabled on this network. Please activate it from Safe Global"
          />
        )}
        {signMessageState.signer &&
          signMessageState.signer.key.type !== 'internal' &&
          signMessageState.signer.key.type !== 'qr' && (
            <HardwareWalletSigningModal
              keyType={signMessageState.signer.key.type}
              isVisible={signStatus === 'LOADING'}
              signingRequest={signMessageState.hardwareWalletSigningRequest}
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
        {signMessageState.signer &&
          signMessageState.signer.key.type === 'qr' &&
          currentRequest &&
          signingStep !== 'idle' && (
            <QrSigningFlowScreen
              isVisible={true}
              onContinue={handleOnContinue}
              currentRequest={currentRequest}
              signingStep={signingStep}
              signingRequest={signMessageState.hardwareWalletSigningRequest}
              submitSignatureResponse={handleSubmitSignatureResponse}
              onReject={handleQrSigningFlowOnRejectPressed}
              handleQrSigningFlowOnBackPressed={handleQrSigningFlowOnBackPressed}
            />
          )}
      </View>
    </Container>
  )
}

export default React.memo(SignInWithEthereum)
