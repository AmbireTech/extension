import React, { Dispatch, SetStateAction, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { humanizeMessage } from '@ambire-common/libs/humanizer'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Alert from '@common/components/Alert'
import ExpandableCard from '@common/components/ExpandableCard'
import HumanizedVisualization from '@common/components/HumanizedVisualization'
import Label from '@common/components/Label'
import NetworkBadge from '@common/components/NetworkBadge'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import HardwareWalletSigningModal from '@common/modules/hardware-wallets/components/HardwareWalletSigningModal'
import spacings, { SPACING_LG, SPACING_MD, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'
import useResponsiveActionWindow from '@web/hooks/useResponsiveActionWindow'
import LedgerConnectModal from '@web/modules/hardware-wallet/components/LedgerConnectModal'
import { QrRequest, QrSigningStep } from '@web/modules/hardware-wallet/qr/types'
import QrSigningFlowScreen from '@web/modules/hardware-wallet/screens/QrSigningFlowScreen'
import FallbackVisualization from '@web/modules/sign-message/screens/SignMessageScreen/FallbackVisualization'
import Info from '@web/modules/sign-message/screens/SignMessageScreen/Info'
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
}

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
  handleQrSigningFlowOnRejectPressed
}: Props) => {
  const { t } = useTranslation()
  const { state: signMessageState, dispatch: signMessageDispatch } =
    useController('SignMessageController')
  const signStatus = signMessageState.statuses.sign
  const { styles, theme, themeType } = useTheme(getStyles)
  const { responsiveSizeMultiplier } = useResponsiveActionWindow()
  const { minHeightSize } = useWindowSize()
  const { networks } = useController('NetworksController').state
  const network = useMemo(
    () =>
      networks.find((n) => {
        return signMessageState.messageToSign?.content.kind === 'typedMessage' &&
          signMessageState.messageToSign?.content.domain.chainId
          ? n.chainId.toString() ===
              signMessageState.messageToSign?.content.domain.chainId.toString()
          : n.chainId === signMessageState.messageToSign?.chainId
      }),
    [networks, signMessageState.messageToSign]
  )
  const humanizedMessage = useMemo(() => {
    if (!signMessageState?.messageToSign) return
    return humanizeMessage(signMessageState.messageToSign)
  }, [signMessageState])
  const visualizeHumanized = useMemo(
    () =>
      humanizedMessage?.fullVisualization &&
      network &&
      signMessageState.messageToSign?.content.kind,
    [network, humanizedMessage, signMessageState.messageToSign?.content?.kind]
  )

  return (
    <TabLayoutWrapperMainContent style={spacings.mbLg}>
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
          <Text weight="medium" fontSize={24 * responsiveSizeMultiplier} style={[spacings.mrSm]}>
            {t('Sign message')}
          </Text>
          <View style={styles.kindOfMessage}>
            <Text fontSize={12} color={theme.infoText} numberOfLines={1}>
              {signMessageState.messageToSign?.content.kind === 'typedMessage' && t('EIP-712')}
              {signMessageState.messageToSign?.content.kind === 'message' && t('Standard')}
              {signMessageState.messageToSign?.content.kind === 'authorization-7702' &&
                t('EIP-7702')}{' '}
              {t('Type')}
            </Text>
          </View>
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
              title="Safe account not enabled on this network. Please activate it from Safe global"
            />
          )}
        </View>
        <View style={flexbox.flex1}>
          <ExpandableCard
            enableToggleExpand={!!visualizeHumanized}
            isInitiallyExpanded={!visualizeHumanized}
            hasArrow={!!visualizeHumanized}
            style={{
              marginBottom: SPACING_TY * responsiveSizeMultiplier,
              // Setting maxHeight on larger screens introduced internal content scroll
              // (which aligns the content better - with internal scrollbar).
              ...(minHeightSize(660) ? {} : { maxHeight: '100%' }),
              backgroundColor: theme.secondaryBackground,
              ...(humanizedMessage?.warnings?.length ? styles.warningContainer : {})
            }}
            content={
              visualizeHumanized &&
              // @TODO: Duplicate check. For some reason ts throws an error if we don't do this
              humanizedMessage?.fullVisualization &&
              signMessageState.messageToSign?.content.kind ? (
                <HumanizedVisualization
                  data={humanizedMessage.fullVisualization}
                  chainId={network?.chainId || 1n}
                  sizeMultiplierSize={responsiveSizeMultiplier}
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
                  <Text fontSize={14 * responsiveSizeMultiplier} appearance="warningText">
                    <Text
                      fontSize={14 * responsiveSizeMultiplier}
                      appearance="warningText"
                      weight="semiBold"
                    >
                      {t('Warning: ')}
                    </Text>
                    {t('Please read the whole message as we are unable to translate it!')}
                  </Text>
                </>
              )
            }
            expandedContent={
              <FallbackVisualization
                setHasReachedBottom={setHasReachedBottom}
                hasReachedBottom={!!hasReachedBottom}
                messageToSign={signMessageState.messageToSign}
                responsiveSizeMultiplier={responsiveSizeMultiplier}
              />
            }
          >
            {humanizedMessage?.warnings?.map((warning) => {
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
        {signMessageState.signer && signMessageState.signer.key.type === 'qr' && (
          <QrSigningFlowScreen
            isVisible={true}
            onContinue={handleOnContinue}
            currentRequest={currentRequest}
            signingStep={signingStep}
            submitSignatureResponse={handleSubmitSignatureResponse}
            onReject={handleQrSigningFlowOnRejectPressed}
          />
        )}
      </View>
    </TabLayoutWrapperMainContent>
  )
}

export default React.memo(Main)
