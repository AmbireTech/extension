import { memo } from 'react'
import { View } from 'react-native'

import HumanizedVisualization, {
  shouldUseErc7730DetailedLayout
} from '@common/components/HumanizedVisualization'
import useTheme from '@common/hooks/useTheme'
import FallbackVisualization from '@common/modules/sign-account-op/components/TransactionSummary/FallbackVisualization'
import spacings from '@common/styles/spacings'

import getStyles from './styles'

import type { IrCall } from '@ambire-common/libs/humanizer/interfaces'
interface Props {
  humanization: IrCall[]
  chainId: bigint
}

const visualizationStyle = { width: '100%', minWidth: 0 } as const

const CompactHumanizedCalls = ({ humanization, chainId }: Props) => {
  const { styles } = useTheme(getStyles)

  return humanization.map((call, index) => {
    const shouldUseDetailedErc7730Layout =
      call.fullVisualization?.some(
        (item) => item?.type === 'erc7730' && shouldUseErc7730DetailedLayout(item)
      ) || false

    return (
      <View
        key={call.id}
        style={[
          styles.item,
          spacings.phTy,
          spacings.pvTy,
          index !== humanization.length - 1 && spacings.mbTy
        ]}
      >
        {call.fullVisualization?.length ? (
          <HumanizedVisualization
            data={call.fullVisualization}
            chainId={chainId}
            sizeMultiplierSize={0.5}
            textSize={12}
            imageSize={12}
            hasPadding={false}
            erc7730Mode={shouldUseDetailedErc7730Layout ? 'description' : 'summary'}
            showErc7730DescriptionTitle={shouldUseDetailedErc7730Layout}
            isErc7730TransactionSummaryLayout={!shouldUseDetailedErc7730Layout}
            disableFlex
            style={visualizationStyle}
            dapp={call.dapp}
          />
        ) : (
          <FallbackVisualization
            call={call}
            sizeMultiplierSize={0.5}
            textSize={12}
            hasPadding={false}
          />
        )}
      </View>
    )
  })
}

export default memo(CompactHumanizedCalls)
