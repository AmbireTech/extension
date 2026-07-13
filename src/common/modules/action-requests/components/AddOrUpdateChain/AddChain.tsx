import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { AddNetworkRequestParams, Network, NetworkFeature } from '@ambire-common/interfaces/network'
import { UserRequest } from '@ambire-common/interfaces/userRequest'
import ManifestFallbackIcon from '@common/assets/svg/ManifestFallbackIcon'
import Alert from '@common/components/Alert'
import NetworkAvailableFeatures from '@common/components/NetworkAvailableFeatures'
import NetworkDetails from '@common/components/NetworkDetails'
import NetworkIcon from '@common/components/NetworkIcon'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import useDappInfo from '@common/hooks/useDappInfo'
import useResponsiveActionWindow from '@common/hooks/useResponsiveActionWindow'
import useTheme from '@common/hooks/useTheme'
import getStyles from '@common/modules/action-requests/styles/styles'
import spacings, { SPACING, SPACING_LG, SPACING_MD } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import ManifestImage from '@web/components/ManifestImage'

type AddChainProps = {
  handleRetryWithDifferentRpcUrl: () => void
  areParamsValid: boolean | null
  features: NetworkFeature[]
  networkDetails?: AddNetworkRequestParams
  actionButtonPressedRef: React.MutableRefObject<boolean>
  rpcUrls: string[]
  rpcUrlIndex: number
  existingNetwork: Network | null | undefined
  userRequest: UserRequest | undefined
}

const Container = ({ children, ...rest }: any) => {
  if (isMobile) return <>{children}</>
  return <ScrollableWrapper {...rest}>{children}</ScrollableWrapper>
}

const AddChain = ({
  handleRetryWithDifferentRpcUrl,
  areParamsValid,
  features,
  networkDetails,
  actionButtonPressedRef,
  rpcUrls,
  rpcUrlIndex,
  existingNetwork,
  userRequest
}: AddChainProps) => {
  const { styles, theme } = useTheme(getStyles)
  const { t } = useTranslation()
  const { name, icon } = useDappInfo(userRequest)
  const { responsiveSizeMultiplier } = useResponsiveActionWindow({ maxBreakpoints: 2 })

  return (
    <>
      <Text
        weight="medium"
        fontSize={20 * responsiveSizeMultiplier}
        style={{
          marginBottom: SPACING_MD * responsiveSizeMultiplier
        }}
      >
        {t('Add new network')}
      </Text>

      <View
        style={[
          styles.dappInfoContainer,
          {
            marginBottom: SPACING_MD * responsiveSizeMultiplier
          }
        ]}
      >
        {!existingNetwork ? (
          <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}>
            <ManifestImage
              uri={icon}
              size={50 * responsiveSizeMultiplier}
              fallback={() => <ManifestFallbackIcon />}
              containerStyle={{
                marginRight: SPACING_MD * responsiveSizeMultiplier
              }}
            />

            <Trans values={{ name: name || 'The App' }}>
              <Text style={flexbox.flex1}>
                <Text fontSize={20 * responsiveSizeMultiplier} appearance="secondaryText">
                  {t('Allow ')}
                </Text>
                <Text fontSize={20 * responsiveSizeMultiplier} weight="semiBold">
                  {'{{name}} '}
                </Text>
                <Text fontSize={20 * responsiveSizeMultiplier} appearance="secondaryText">
                  {t('to add a network')}
                </Text>
              </Text>
            </Trans>
          </View>
        ) : (
          <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}>
            <NetworkIcon
              id={String(existingNetwork.chainId)}
              size={50 * responsiveSizeMultiplier}
              style={{
                marginRight: SPACING_MD * responsiveSizeMultiplier
              }}
            />

            <View style={flexbox.flex1}>
              <Text fontSize={20 * responsiveSizeMultiplier} weight="semiBold">
                {existingNetwork.name}
              </Text>
              <Text
                fontSize={16 * responsiveSizeMultiplier}
                appearance="secondaryText"
                weight="medium"
                numberOfLines={2}
              >
                {t("found in Ambire Wallet but it's disabled. Do you wish to enable it?")}
              </Text>
            </View>
          </View>
        )}
      </View>
      {!existingNetwork && (
        <Text
          fontSize={14 * responsiveSizeMultiplier}
          weight="medium"
          appearance="secondaryText"
          style={{
            marginBottom: SPACING * responsiveSizeMultiplier
          }}
        >
          {t('Ambire Wallet does not verify custom networks.')}
        </Text>
      )}
      {!!areParamsValid && !!networkDetails && (
        <View
          style={[
            isWeb && flexbox.directionRow,
            flexbox.flex1,
            isWeb && {
              marginBottom: SPACING_LG * responsiveSizeMultiplier
            }
          ]}
        >
          <Container
            style={[
              styles.boxWrapper,
              { width: '50%', maxHeight: '100%' },
              // @ts-ignore value missing in the props, but it's available on web
              { height: 'fit-content' }
            ]}
          >
            <NetworkDetails
              name={networkDetails.name || userRequest?.meta?.params?.[0]?.chainName}
              iconUrls={networkDetails?.iconUrls || []}
              chainId={networkDetails.chainId}
              rpcUrls={networkDetails.rpcUrls}
              selectedRpcUrl={rpcUrls[rpcUrlIndex] as any}
              nativeAssetSymbol={networkDetails.nativeAssetSymbol}
              nativeAssetName={networkDetails.nativeAssetName}
              explorerUrl={networkDetails.explorerUrl || '-'}
              style={{
                backgroundColor: theme.secondaryBackground,
                ...(isMobile && spacings.mbSm)
              }}
              responsiveSizeMultiplier={responsiveSizeMultiplier}
              type="vertical"
            />
          </Container>
          {isWeb && <View style={styles.separator} />}
          <Container style={flexbox.flex1} contentContainerStyle={{ flexGrow: 1 }}>
            {!!networkDetails && (
              <NetworkAvailableFeatures
                features={features}
                chainId={networkDetails.chainId}
                withRetryButton={!!rpcUrls.length && rpcUrlIndex < rpcUrls.length - 1}
                handleRetryWithDifferentRpcUrl={handleRetryWithDifferentRpcUrl}
                responsiveSizeMultiplier={responsiveSizeMultiplier}
              />
            )}
          </Container>
        </View>
      )}
      {!areParamsValid && areParamsValid !== null && !actionButtonPressedRef.current && (
        <View style={[flexbox.flex1, flexbox.alignCenter, flexbox.justifyCenter]}>
          <Alert
            title={t('Invalid Request Params')}
            text={t(
              '{{name}} provided invalid params for adding a new network. Try adding it from another App or manually from Settings.',
              {
                name: name || 'The App'
              }
            )}
            type="error"
          />
        </View>
      )}
    </>
  )
}
export default React.memo(AddChain)
