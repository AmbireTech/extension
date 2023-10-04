import { ACTION_GAS_COSTS, AMBIRE_OVERHEAD_COST } from 'ambire-common/src/constants/actionGasCosts'
import useCacheBreak from 'ambire-common/src/hooks/useCacheBreak'
import React, { useEffect, useState } from 'react'
import { TouchableOpacity } from 'react-native'

import GasTankIcon from '@common/assets/svg/GasTankIcon'
import Text from '@common/components/Text'
import CONFIG, { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useNetwork from '@common/hooks/useNetwork'
import { ROUTES } from '@common/modules/router/constants/common'
import { fetchGet } from '@common/services/fetch'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'

interface Props {
  handleNavigate: (route: ROUTES) => void
}
const relayerURL = CONFIG.RELAYER_URL

const GAS_COST_ERC20_TRANSFER =
  ACTION_GAS_COSTS?.find((c) => c.name === 'ERC20: Transfer')?.gas + AMBIRE_OVERHEAD_COST

const GasIndicator = ({ handleNavigate }: Props) => {
  const [gasData, setGasData] = useState<any>(null)
  const { cacheBreak } = useCacheBreak()
  const { network } = useNetwork()
  const { t } = useTranslation()

  useEffect(() => {
    let unmounted = false
    const url = `${relayerURL}/gasPrice/${network?.id}?cacheBreak=${cacheBreak}`

    fetchGet(url)
      .then((res) => {
        if (unmounted) return

        setGasData(res.data)
      })
      .catch((err) => {
        if (unmounted) return
        console.log('fetch error', err)
      })
    return () => {
      unmounted = true
    }
  }, [network?.id, cacheBreak])

  if (gasData) {
    return (
      <TouchableOpacity
        style={[flexboxStyles.directionRow, flexboxStyles.alignCenter]}
        activeOpacity={0.6}
        hitSlop={{
          left: 5,
          right: 5,
          top: 10,
          bottom: 5
        }}
        onPress={() => handleNavigate(ROUTES.gasInformation)}
      >
        <Text fontSize={14} color={colors.titan_50}>
          {network?.nativeAssetSymbol}
          {': '}
          {Number(gasData.gasFeeAssets.native).toLocaleString('en-US', {
            minimumFractionDigits: 2
          })}
        </Text>
        <Text style={[spacings.prMi, spacings.plTy]} color={colors.heliotrope} fontSize={16}>
          |
        </Text>
        <GasTankIcon />
        <Text fontSize={14} color={colors.titan_50}>
          $
          {(
            (((gasData.gasPrice.maxPriorityFeePerGas
              ? gasData.gasPrice.maxPriorityFeePerGas.medium + gasData.gasPrice.medium
              : gasData.gasPrice.medium) *
              GAS_COST_ERC20_TRANSFER) /
              10 ** 18) *
            gasData.gasFeeAssets.native
          ).toFixed(2)}
        </Text>
      </TouchableOpacity>
    )
  }

  return isWeb ? (
    <Text fontSize={14} color={colors.titan_50}>
      {t('Loading gas info...')}
    </Text>
  ) : null
}

export default GasIndicator
