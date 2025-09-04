import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { Session } from '@ambire-common/classes/session'
import { Statuses } from '@ambire-common/interfaces/eventEmitter'
import { AddNetworkRequestParams, Network, NetworkFeature } from '@ambire-common/interfaces/network'
import { DappUserRequest } from '@ambire-common/interfaces/userRequest'
import ManifestFallbackIcon from '@common/assets/svg/ManifestFallbackIcon'
import NetworkIcon from '@common/components/NetworkIcon'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import HeaderAccountAndNetworkInfo from '@web/components/HeaderAccountAndNetworkInfo'
import ManifestImage from '@web/components/ManifestImage'
import NetworkAvailableFeatures from '@web/components/NetworkAvailableFeatures'
import NetworkDetails from '@web/components/NetworkDetails'
import { TabLayoutContainer, TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'

import ActionFooter from '../../components/ActionFooter'
import getStyles from './styles'

type AddChainProps = {
  handleDenyButtonPress: () => void
  handlePrimaryButtonPress: () => void
  handleRetryWithDifferentRpcUrl: () => void
  areParamsValid: boolean | null
  statuses: Statuses<'addNetwork' | 'updateNetwork'> & Statuses<string>
  features: NetworkFeature[]
  networkDetails: AddNetworkRequestParams
  requestSession: Session | undefined
  actionButtonPressedRef: React.MutableRefObject<boolean>
  rpcUrls: string[]
  rpcUrlIndex: number
  resolveButtonText: string
  existingNetwork: Network | null | undefined
  userRequest: DappUserRequest | undefined
}

const AddChain = ({
  handleDenyButtonPress,
  handlePrimaryButtonPress,
  handleRetryWithDifferentRpcUrl,
  areParamsValid,
  statuses,
  features,
  networkDetails,
  requestSession,
  actionButtonPressedRef,
  rpcUrls,
  rpcUrlIndex,
  resolveButtonText,
  existingNetwork,
  userRequest
}: AddChainProps) => {
  const { styles, theme, themeType } = useTheme(getStyles)
  const { t } = useTranslation()

  return (
    <TabLayoutContainer
      width="full"
      header={
        <HeaderAccountAndNetworkInfo
          backgroundColor={
            themeType === THEME_TYPES.DARK
              ? (theme.tertiaryBackground as string)
              : (theme.primaryBackground as string)
          }
        />
      }
      footer={
        <ActionFooter
          onReject={handleDenyButtonPress}
          onResolve={handlePrimaryButtonPress}
          resolveButtonText={resolveButtonText}
          resolveDisabled={
            !areParamsValid ||
            statuses.addNetwork === 'LOADING' ||
            statuses.updateNetwork === 'LOADING' ||
            (features &&
              (features.some((f) => f.level === 'loading') ||
                !!features.filter((f) => f.id === 'flagged')[0])) ||
            actionButtonPressedRef.current
          }
        />
      }
      backgroundColor={theme.quinaryBackground}
    >
      <TabLayoutWrapperMainContent style={spacings.mbLg} withScroll={false}>
        <>
          <Text weight="medium" fontSize={20} style={spacings.mbMd}>
            {t('Add new network')}
          </Text>

          <View style={styles.dappInfoContainer}>
            {!existingNetwork && (
              <ManifestImage
                uri={requestSession?.icon}
                size={50}
                fallback={() => <ManifestFallbackIcon />}
                containerStyle={spacings.mrMd}
              />
            )}

            {!existingNetwork ? (
              <Trans values={{ name: requestSession?.name || 'The App' }}>
                <Text>
                  <Text fontSize={20} appearance="secondaryText">
                    {t('Allow ')}
                  </Text>
                  <Text fontSize={20} weight="semiBold">
                    {'{{name}} '}
                  </Text>
                  <Text fontSize={20} appearance="secondaryText">
                    {t('to add a network')}
                  </Text>
                </Text>
              </Trans>
            ) : (
              <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}>
                <NetworkIcon id={String(existingNetwork.chainId)} size={50} style={spacings.mrMd} />

                <View style={flexbox.flex1}>
                  <Text fontSize={20} weight="semiBold">
                    {existingNetwork.name}
                  </Text>
                  <Text appearance="secondaryText" weight="medium" numberOfLines={2}>
                    {t("found in Ambire Wallet but it's disabled. Do you wish to enable it?")}
                  </Text>
                </View>
              </View>
            )}
          </View>
          {!existingNetwork && (
            <Text fontSize={14} weight="medium" appearance="secondaryText" style={spacings.mb}>
              {t('Ambire Wallet does not verify custom networks.')}
            </Text>
          )}
          {!!areParamsValid && !!networkDetails && (
            <View style={[flexbox.directionRow, flexbox.flex1]}>
              <View style={styles.boxWrapper}>
                <ScrollableWrapper style={flexbox.flex1} contentContainerStyle={{ flexGrow: 1 }}>
                  <NetworkDetails
                    name={networkDetails.name || userRequest?.action?.params?.[0]?.chainName}
                    iconUrls={networkDetails?.iconUrls || []}
                    chainId={networkDetails.chainId}
                    rpcUrls={networkDetails.rpcUrls}
                    selectedRpcUrl={rpcUrls[rpcUrlIndex]}
                    nativeAssetSymbol={networkDetails.nativeAssetSymbol}
                    nativeAssetName={networkDetails.nativeAssetName}
                    explorerUrl={networkDetails.explorerUrl}
                    style={{
                      backgroundColor:
                        themeType === THEME_TYPES.DARK
                          ? theme.secondaryBackground
                          : theme.primaryBackground
                    }}
                    type="vertical"
                  />
                </ScrollableWrapper>
              </View>
              <View style={styles.separator} />
              <ScrollableWrapper style={flexbox.flex1} contentContainerStyle={{ flexGrow: 1 }}>
                {!!networkDetails && (
                  <NetworkAvailableFeatures
                    features={features}
                    chainId={networkDetails.chainId}
                    withRetryButton={!!rpcUrls.length && rpcUrlIndex < rpcUrls.length - 1}
                    handleRetry={handleRetryWithDifferentRpcUrl}
                  />
                )}
              </ScrollableWrapper>
            </View>
          )}
          {!areParamsValid && areParamsValid !== null && !actionButtonPressedRef.current && (
            <View style={[flexbox.flex1, flexbox.alignCenter, flexbox.justifyCenter]}>
              <Alert
                title={t('Invalid Request Params')}
                text={t(
                  `${
                    userRequest?.session?.name || 'The App'
                  } provided invalid params for adding a new network.`
                )}
                type="error"
              />
            </View>
          )}
        </>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}
export default React.memo(AddChain)
