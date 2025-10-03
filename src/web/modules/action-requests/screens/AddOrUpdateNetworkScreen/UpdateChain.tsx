import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { Statuses } from '@ambire-common/interfaces/eventEmitter'
import { AddNetworkRequestParams, Network, NetworkFeature } from '@ambire-common/interfaces/network'
import { DappUserRequest } from '@ambire-common/interfaces/userRequest'
import ArrowRightIcon from '@common/assets/svg/ArrowRightIcon'
import ManifestFallbackIcon from '@common/assets/svg/ManifestFallbackIcon'
import Banner from '@common/components/Banner'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import HeaderAccountAndNetworkInfo from '@web/components/HeaderAccountAndNetworkInfo'
import ManifestImage from '@web/components/ManifestImage'
import NetworkAvailableFeatures from '@web/components/NetworkAvailableFeatures'
import { TabLayoutContainer, TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'
import useDappInfo from '@web/hooks/useDappInfo'

import ActionFooter from '../../components/ActionFooter'
import RpcCard from './RpcCard'
import getStyles from './styles'

type UpdateChainProps = {
  handleDenyButtonPress: () => void
  handleUpdateNetwork: () => void
  handleRetryWithDifferentRpcUrl: () => void
  areParamsValid: boolean | null
  statuses: Statuses<'addNetwork' | 'updateNetwork'> & Statuses<string>
  features: NetworkFeature[]
  networkDetails: AddNetworkRequestParams
  networkAlreadyAdded: Network
  userRequest: DappUserRequest | undefined
  actionButtonPressedRef: React.MutableRefObject<boolean>
  rpcUrls: string[]
  rpcUrlIndex: number
}

const UpdateChain = ({
  handleDenyButtonPress,
  handleUpdateNetwork,
  handleRetryWithDifferentRpcUrl,
  areParamsValid,
  statuses,
  features,
  networkDetails,
  networkAlreadyAdded,
  userRequest,
  actionButtonPressedRef,
  rpcUrls,
  rpcUrlIndex
}: UpdateChainProps) => {
  const { styles, theme, themeType } = useTheme(getStyles)
  const { t } = useTranslation()
  const { name, icon } = useDappInfo(userRequest)

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
          onResolve={handleUpdateNetwork}
          resolveButtonText={t('Update network')}
          rejectButtonText={t('Reject')}
          resolveDisabled={
            !areParamsValid ||
            statuses.addNetwork === 'LOADING' ||
            statuses.updateNetwork === 'LOADING' ||
            (features &&
              (features.some((f) => f.level === 'loading') ||
                !!features.find((f) => f.id === 'flagged'))) ||
            actionButtonPressedRef.current
          }
        />
      }
      backgroundColor={theme.quinaryBackground}
    >
      <TabLayoutWrapperMainContent style={spacings.mbLg} withScroll={false}>
        <>
          <Text weight="medium" fontSize={20} style={spacings.mbMd}>
            {t('Update network')}
          </Text>

          <View style={styles.dappInfoContainer}>
            <ManifestImage
              uri={icon}
              size={50}
              fallback={() => <ManifestFallbackIcon />}
              containerStyle={spacings.mrMd}
            />

            <Trans values={{ name: name || 'The App' }}>
              <Text>
                <Text fontSize={20} appearance="secondaryText">
                  {t('Allow ')}
                </Text>
                <Text fontSize={20} weight="semiBold">
                  {'{{name}} '}
                </Text>
                <Text fontSize={20} appearance="secondaryText">
                  {t(`to update ${networkAlreadyAdded.name}`)}
                </Text>
              </Text>
            </Trans>
          </View>

          <Text fontSize={16} weight="semiBold" appearance="secondaryText">
            {t('This site is requesting to update your default RPC')}
          </Text>
          <View
            style={[
              flexbox.directionRow,
              flexbox.flex1,
              flexbox.justifySpaceBetween,
              flexbox.alignStart
            ]}
          >
            <View
              style={[
                flexbox.directionRow,
                flexbox.flex1,
                flexbox.justifySpaceBetween,
                flexbox.alignCenter,
                spacings.mt
              ]}
            >
              <RpcCard title="Old RPC URL" url={networkAlreadyAdded.selectedRpcUrl}>
                <NetworkAvailableFeatures
                  hideBackgroundAndBorders
                  titleSize={14}
                  features={networkAlreadyAdded.features}
                  chainId={networkAlreadyAdded.chainId}
                  withRetryButton={!!rpcUrls.length && rpcUrlIndex < rpcUrls.length - 1}
                  handleRetry={handleRetryWithDifferentRpcUrl}
                />
              </RpcCard>
              <ArrowRightIcon />
              <RpcCard title="New RPC URL" url={networkDetails.selectedRpcUrl} isNew>
                <NetworkAvailableFeatures
                  hideBackgroundAndBorders
                  titleSize={14}
                  features={features}
                  chainId={networkDetails.chainId}
                  withRetryButton={!!rpcUrls.length && rpcUrlIndex < rpcUrls.length - 1}
                  handleRetry={handleRetryWithDifferentRpcUrl}
                />
              </RpcCard>
            </View>
          </View>
          <Banner
            title={t(
              'Make sure you trust this site and provider. You can change the RPC URL anytime in the network settings.'
            )}
            type="info2"
          />
          <View style={spacings.mtMi} />
        </>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}
export default React.memo(UpdateChain)
