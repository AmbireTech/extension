import React, { FC, useCallback, useMemo } from 'react'
import { ColorValue, Image, ImageSourcePropType, View } from 'react-native'

import colibriLogo from '@common/assets/images/colibri-logo.png'
import ErrorIcon from '@common/assets/svg/ErrorIcon'
import SuccessIcon from '@common/assets/svg/SuccessIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Spinner from '@common/components/Spinner'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  color: ColorValue
  isVisible: boolean
}

type ChainStatus = 'loading' | 'success' | 'warning'

const ColibriVerificationBadge: FC<Props> = ({ color, isVisible }) => {
  const { t } = useTranslation()
  const { portfolio } = useController('SelectedAccountController').state
  const { allNetworks } = useController('NetworksController').state

  const configuredChainIds = useMemo(
    () =>
      allNetworks
        .filter((network) => !!network.isColibriEnabled)
        .map((network) => network.chainId.toString()),
    [allNetworks]
  )

  const statusByChainId = useMemo<Record<string, ChainStatus>>(() => {
    return Object.fromEntries(
      Object.entries(portfolio.portfolioState)
        .filter(([, state]) => state?.verification?.provider === 'colibri')
        .map(([chainId, state]) => [chainId, state!.verification!.status as ChainStatus])
    )
  }, [portfolio.portfolioState])

  const getChainStatus = useCallback(
    (chainId: string): ChainStatus => {
      return (
        statusByChainId[chainId] ||
        (portfolio.portfolioState[chainId]?.isReady ? 'success' : 'loading')
      )
    },
    [portfolio.portfolioState, statusByChainId]
  )

  const status = useMemo(() => {
    if (!configuredChainIds.length) return null
    if (configuredChainIds.some((chainId) => getChainStatus(chainId) === 'warning')) {
      return 'warning'
    }
    if (configuredChainIds.some((chainId) => getChainStatus(chainId) !== 'success')) {
      return 'loading'
    }

    return 'success'
  }, [configuredChainIds, getChainStatus])

  const chainsByStatus = useMemo(() => {
    const namesByStatus = {
      loading: [] as string[],
      success: [] as string[],
      warning: [] as string[]
    }

    configuredChainIds.forEach((chainId) => {
      const network = allNetworks.find((n) => n.chainId.toString() === chainId)
      const networkName = network?.name || chainId
      const chainStatus = getChainStatus(chainId)
      namesByStatus[chainStatus].push(networkName)
    })

    return namesByStatus
  }, [allNetworks, configuredChainIds, getChainStatus])

  const tooltipContent = useMemo(() => {
    if (status === 'success') {
      return t('Balances verified by Colibri on {{chains}}', {
        chains: chainsByStatus.success.join(', ')
      })
    }

    if (status === 'warning') {
      return t("Colibri couldn't verify the balances on {{chains}}", {
        chains: chainsByStatus.warning.join(', ')
      })
    }

    return t('Balances are being verified by Colibri on {{chains}}', {
      chains: chainsByStatus.loading.join(', ')
    })
  }, [chainsByStatus.loading, chainsByStatus.success, chainsByStatus.warning, status, t])

  if (!status) return null

  return (
    <View
      pointerEvents={isVisible ? 'auto' : 'none'}
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        spacings.mrTy,
        { marginLeft: -36, opacity: isVisible ? 1 : 0 }
      ]}
      dataSet={createGlobalTooltipDataSet({
        id: 'colibri-portfolio-verification',
        content: tooltipContent
      })}
    >
      <Image
        source={colibriLogo as ImageSourcePropType}
        style={{ width: 22, height: 22 }}
        resizeMode="contain"
      />
      {status === 'loading' && <Spinner variant="white" style={{ width: 12, height: 12 }} />}
      {status === 'warning' && <ErrorIcon width={14} height={14} color={color} />}
      {status === 'success' && <SuccessIcon width={14} height={14} color={color} />}
    </View>
  )
}

export default React.memo(ColibriVerificationBadge)
