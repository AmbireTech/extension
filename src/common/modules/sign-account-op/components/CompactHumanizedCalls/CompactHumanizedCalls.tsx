import { memo } from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'

import HumanizedVisualization, {
  shouldUseErc7730DetailedLayout
} from '@common/components/HumanizedVisualization'
import useTheme from '@common/hooks/useTheme'
import FallbackVisualization from '@common/modules/sign-account-op/components/TransactionSummary/FallbackVisualization'
import { sizeMultiplier } from '@common/modules/sign-account-op/components/TransactionSummary/sizeMultiplier'
import spacings from '@common/styles/spacings'

import getStyles from './styles'

import type { IrCall } from '@ambire-common/libs/humanizer/interfaces'
import type { TextWeight } from '@common/components/Text'
interface Props {
  humanization: IrCall[]
  chainId: bigint
  /** The base text size of the visualization. The titles are 2px bigger. */
  textSize?: number
  /** The size of the title of a call. Defaults to `textSize`. */
  titleTextSize?: number
  /** The size of the row labels of a call. Defaults to `textSize`. */
  labelTextSize?: number
  labelWeight?: TextWeight
  /** Style applied to the frame of every call, on top of the default one. */
  itemStyle?: StyleProp<ViewStyle>
}

const visualizationStyle = { width: '100%', minWidth: 0 } as const
const dappIconSize = 24 * sizeMultiplier.md

const CompactHumanizedCalls = ({
  humanization,
  chainId,
  textSize = 12,
  titleTextSize,
  labelTextSize,
  labelWeight,
  itemStyle
}: Props) => {
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
          itemStyle,
          index !== humanization.length - 1 && spacings.mbTy
        ]}
      >
        {call.fullVisualization?.length ? (
          <HumanizedVisualization
            data={call.fullVisualization}
            chainId={chainId}
            sizeMultiplierSize={0.5}
            textSize={textSize}
            imageSize={textSize}
            hasPadding={false}
            erc7730Mode={shouldUseDetailedErc7730Layout ? 'description' : 'summary'}
            showErc7730DescriptionTitle={shouldUseDetailedErc7730Layout}
            erc7730TitleTextSize={titleTextSize}
            erc7730LabelTextSize={labelTextSize}
            erc7730LabelWeight={labelWeight}
            isErc7730TransactionSummaryLayout={!shouldUseDetailedErc7730Layout}
            disableFlex
            inlineDappIcon
            dappIconSize={dappIconSize}
            style={visualizationStyle}
            dapp={call.dapp}
          />
        ) : (
          <FallbackVisualization
            call={call}
            sizeMultiplierSize={0.5}
            textSize={textSize}
            hasPadding={false}
          />
        )}
      </View>
    )
  })
}

export default memo(CompactHumanizedCalls)
