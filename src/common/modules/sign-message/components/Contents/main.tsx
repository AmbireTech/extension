import React, { Dispatch, SetStateAction, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { QrRequest } from '@ambire-common/interfaces/keystore'
import {
  HumanizerErc7730Visualization,
  HumanizerVisualization,
  HumanizerWarning,
  IrMessage
} from '@ambire-common/libs/humanizer/interfaces'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Alert from '@common/components/Alert'
import ExpandableCard from '@common/components/ExpandableCard'
import HumanizedVisualization, {
  Erc7730StructuredVisualization,
  getNestedErc7730Visualizations
} from '@common/components/HumanizedVisualization'
import Label from '@common/components/Label'
import NetworkBadge from '@common/components/NetworkBadge'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useResponsiveActionWindow from '@common/hooks/useResponsiveActionWindow'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import HardwareWalletSigningModal from '@common/modules/hardware-wallets/components/HardwareWalletSigningModal'
import SafetyChecksBanner from '@common/modules/sign-account-op/components/SafetyChecksBanner'
import FallbackVisualization from '@common/modules/sign-message/components/FallbackVisualization'
import Info from '@common/modules/sign-message/components/Info'
import spacings, { SPACING_LG, SPACING_MD, SPACING_TY } from '@common/styles/spacings'
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
  hasReachedBottom: boolean | null
  setHasReachedBottom: Dispatch<SetStateAction<boolean | null>>
  shouldDisplayEIP1271Warning: boolean
  isSafeNotDeployed: boolean
  currentRequest: QrRequest | null
  signingStep: QrSigningStep
  handleOnContinue: () => void
  handleSubmitSignatureResponse: (payload: string | Uint8Array) => void
  handleQrSigningFlowOnRejectPressed: () => void
  handleQrSigningFlowOnBackPressed: () => void
  humanizedMessage?: IrMessage
  isHumanizing: boolean
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

const isErc7730Visualization = (
  item: HumanizerVisualization | undefined
): item is HumanizerVisualization & HumanizerErc7730Visualization => item?.type === 'erc7730'

const Erc7730TypedMessageContent = React.memo(
  ({
    data,
    chainId,
    responsiveSizeMultiplier,
    warnings
  }: {
    data: (HumanizerVisualization & HumanizerErc7730Visualization)[]
    chainId: bigint
    responsiveSizeMultiplier: number
    warnings?: HumanizerWarning[]
  }) => {
    const { t } = useTranslation()
    const { styles, theme } = useTheme(getStyles)
    const title = useMemo(() => data.find((item) => !!item.title)?.title, [data])
    const nestedVisualizations = useMemo(
      () => data.flatMap((item) => getNestedErc7730Visualizations(item)),
      [data]
    )
    const hasNestedVisualizations = nestedVisualizations.length > 0

    return (
      <View style={{ width: '100%' }}>
        {hasNestedVisualizations ? (
          nestedVisualizations.map((nestedVisualization, nestedIndex) => (
            <View
              key={nestedVisualization.id}
              style={[
                nestedIndex > 0 && { marginTop: SPACING_TY * responsiveSizeMultiplier },
                spacings.pbMi
              ]}
            >
              <Erc7730StructuredVisualization
                item={nestedVisualization}
                chainId={chainId}
                sizeMultiplierSize={responsiveSizeMultiplier}
                textSize={14}
                mode="summary"
                hasRightArrow
              />
            </View>
          ))
        ) : (
          <Text
            fontSize={16 * responsiveSizeMultiplier}
            weight="semiBold"
            color={theme.secondaryAccent400}
            style={styles.erc7730TypedMessageTitle}
          >
            {title || t('Message details')}
          </Text>
        )}
        {!!warnings?.length && (
          <View
            style={{
              marginTop: SPACING_TY * responsiveSizeMultiplier
            }}
          >
            {warnings.map((warning) => (
              <Label
                size="lg"
                key={warning.content}
                text={warning.content}
                type="warning"
                hasBottomSpacing={false}
              />
            ))}
          </View>
        )}
        <View
          style={[
            styles.erc7730TypedMessageDivider,
            {
              marginTop: SPACING_TY * responsiveSizeMultiplier,
              marginBottom: SPACING_TY * responsiveSizeMultiplier
            }
          ]}
        />
        <HumanizedVisualization
          data={data}
          chainId={chainId}
          sizeMultiplierSize={responsiveSizeMultiplier}
          textSize={14}
          hasPadding={false}
          erc7730Mode="description"
          hideNestedErc7730Rows={hasNestedVisualizations}
        />
      </View>
    )
  }
)

const Main = ({
  shouldDisplayLedgerConnectModal,
  isLedgerConnected,
  handleDismissLedgerConnectModal,
  hasReachedBottom,
  setHasReachedBottom,
  shouldDisplayEIP1271Warning,
  isSafeNotDeployed,
  currentRequest,
  signingStep,
  handleOnContinue,
  handleSubmitSignatureResponse,
  handleQrSigningFlowOnRejectPressed,
  handleQrSigningFlowOnBackPressed,
  humanizedMessage,
  isHumanizing
}: Props) => {
  const { t } = useTranslation()
  const { state: signMessageState, dispatch: signMessageDispatch } =
    useController('SignMessageController')
  const signStatus = signMessageState.statuses.sign
  const { styles, theme } = useTheme(getStyles)
  const { responsiveSizeMultiplier } = useResponsiveActionWindow()
  const { minHeightSize } = useWindowSize()
  const { networks } = useController('NetworksController').state
  const network = useMemo(
    () =>
      networks.find((n) => {
        return signMessageState.messageToSign?.content.kind === 'typedMessage' &&
          signMessageState.messageToSign?.content.domain.chainId
          ? BigInt(n.chainId) === BigInt(signMessageState.messageToSign?.content.domain.chainId)
          : n.chainId === signMessageState.messageToSign?.chainId
      }),
    [networks, signMessageState.messageToSign]
  )
  const visualizeHumanized = useMemo(
    () =>
      !!(
        humanizedMessage?.fullVisualization?.length &&
        network &&
        signMessageState.messageToSign?.content.kind
      ),
    [network, humanizedMessage, signMessageState.messageToSign?.content?.kind]
  )
  const typedMessageErc7730Visualizations = useMemo(
    () => humanizedMessage?.fullVisualization?.filter(isErc7730Visualization) || [],
    [humanizedMessage?.fullVisualization]
  )
  const shouldUseErc7730TypedMessageCard =
    signMessageState.messageToSign?.content.kind === 'typedMessage' &&
    typedMessageErc7730Visualizations.length > 0
  const messageVisualizationMode = isHumanizing
    ? 'humanizing'
    : visualizeHumanized
      ? 'humanized'
      : 'fallback'
  const messageVisualizationKey = `${signMessageState.messageToSign?.fromRequestId}-${messageVisualizationMode}`

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
            style={[spacings.mrSm]}
          >
            {t('Sign message')}
          </Text>
          {isWeb && (
            <View style={styles.kindOfMessage}>
              <Text fontSize={12} color={theme.infoText} numberOfLines={1}>
                {signMessageState.messageToSign?.content.kind === 'typedMessage' && t('EIP-712')}
                {signMessageState.messageToSign?.content.kind === 'message' && t('Standard')}
                {signMessageState.messageToSign?.content.kind === 'authorization-7702' &&
                  t('EIP-7702')}{' '}
                {t('Type')}
              </Text>
            </View>
          )}
        </View>
        <NetworkBadge
          chainId={signMessageState.messageToSign?.chainId}
          responsiveSizeMultiplier={responsiveSizeMultiplier}
          withOnPrefix
        />
        {/* @TODO: Replace with Badge; add size prop to badge; add tooltip  */}
      </View>
      {isMobile && (
        <View style={[flexbox.alignStart, { height: 24, marginBottom: -24 }]}>
          <View style={[styles.kindOfMessage, { transform: [{ translateY: -18 }] }]}>
            <Text fontSize={12} color={theme.infoText} numberOfLines={1}>
              {signMessageState.messageToSign?.content.kind === 'typedMessage' && t('EIP-712')}
              {signMessageState.messageToSign?.content.kind === 'message' && t('Standard')}
              {signMessageState.messageToSign?.content.kind === 'authorization-7702' &&
                t('EIP-7702')}{' '}
              {t('Type')}
            </Text>
          </View>
        </View>
      )}
      {!!signMessageState.banners?.length && (
        <View style={spacings.mbLg}>
          {signMessageState.banners.map((banner) => (
            <SafetyChecksBanner
              key={banner.id}
              type={banner.type}
              text={banner.text}
              style={spacings.mbTy}
            />
          ))}
        </View>
      )}
      <View style={styles.container}>
        <View
          style={{
            marginBottom: SPACING_LG * responsiveSizeMultiplier
          }}
        >
          <Info />
          {shouldDisplayEIP1271Warning && (
            <Alert
              type="error"
              size="sm"
              style={spacings.mt}
              title="This app has been flagged to not support Smart Account signatures."
              text="If you encounter issues, please use an EOA account and contact the app to resolve this."
            />
          )}
          {isSafeNotDeployed && (
            <Alert
              type="error"
              title="Safe account not enabled on this network. Please activate it from Safe Global"
              style={spacings.mt}
            />
          )}
        </View>
        <View style={flexbox.flex1}>
          <ExpandableCard
            key={messageVisualizationKey}
            enableToggleExpand={visualizeHumanized}
            hasArrow={!humanizedMessage?.canHideDropdownArrow && visualizeHumanized}
            isInitiallyExpanded={!visualizeHumanized && !isHumanizing}
            style={{
              marginBottom: SPACING_TY * responsiveSizeMultiplier,
              backgroundColor: theme.secondaryBackground,
              ...(humanizedMessage?.warnings?.length ? styles.warningContainer : {})
            }}
            content={
              isHumanizing ? (
                <View style={flexbox.flex1}>
                  <Spinner />
                </View>
              ) : shouldUseErc7730TypedMessageCard ? (
                <Erc7730TypedMessageContent
                  data={typedMessageErc7730Visualizations}
                  chainId={network?.chainId || signMessageState.messageToSign?.chainId || 1n}
                  responsiveSizeMultiplier={responsiveSizeMultiplier}
                  warnings={humanizedMessage?.warnings}
                />
              ) : visualizeHumanized &&
                // @TODO: Duplicate check. For some reason ts throws an error if we don't do this
                humanizedMessage?.fullVisualization &&
                signMessageState.messageToSign?.content.kind ? (
                <HumanizedVisualization
                  data={humanizedMessage.fullVisualization}
                  chainId={network?.chainId || 1n}
                  sizeMultiplierSize={responsiveSizeMultiplier}
                  textSize={14}
                />
              ) : (
                <>
                  <View
                    style={{
                      marginRight: SPACING_TY * responsiveSizeMultiplier
                    }}
                  >
                    <WarningIcon
                      width={24 * responsiveSizeMultiplier}
                      height={24 * responsiveSizeMultiplier}
                      color={theme.warningText}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text fontSize={14 * responsiveSizeMultiplier} appearance="warningText">
                      <Text
                        fontSize={14 * responsiveSizeMultiplier}
                        appearance="warningText"
                        weight="semiBold"
                        style={{ flex: 1 }}
                      >
                        {t('Warning: ')}
                      </Text>
                      {t('No "clear sign" translation for this message. Please read it carefully!')}
                    </Text>
                  </View>
                </>
              )
            }
            expandedContent={
              <FallbackVisualization
                setHasReachedBottom={setHasReachedBottom}
                hasReachedBottom={!!hasReachedBottom}
                messageToSign={signMessageState.messageToSign}
                humanizedMessage={humanizedMessage}
                responsiveSizeMultiplier={responsiveSizeMultiplier}
                withScrollDownArrow
                rawOnly={shouldUseErc7730TypedMessageCard}
              />
            }
          >
            {!shouldUseErc7730TypedMessageCard &&
              humanizedMessage?.warnings?.map((warning) => {
                return (
                  <Label
                    size="lg"
                    key={warning.content}
                    text={warning.content}
                    type="warning"
                    style={spacings.mlMd}
                  />
                )
              })}
          </ExpandableCard>
        </View>
        {signMessageState.signer &&
          signMessageState.signer.key.type !== 'internal' &&
          signMessageState.signer.key.type !== 'qr' && (
            <HardwareWalletSigningModal
              keyType={signMessageState.signer.key.type}
              isVisible={signStatus === 'LOADING'}
              cancelReq={() => {
                signMessageDispatch({
                  type: 'method',
                  params: {
                    method: 'cancelSignReq',
                    args: []
                  }
                })
              }}
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
              submitSignatureResponse={handleSubmitSignatureResponse}
              onReject={handleQrSigningFlowOnRejectPressed}
              handleQrSigningFlowOnBackPressed={handleQrSigningFlowOnBackPressed}
            />
          )}
      </View>
    </Container>
  )
}

export default React.memo(Main)
