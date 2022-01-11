import React from 'react'
import { View } from 'react-native'
import { VictoryLegend, VictoryPie } from 'victory-native'
import { VictoryPieProps } from 'victory-pie'

import Panel from '@modules/common/components/Panel'
import Text from '@modules/common/components/Text'
import Title from '@modules/common/components/Title'
import usePortfolio from '@modules/common/hooks/usePortfolio'
import colors from '@modules/common/styles/colors'
import { SPACING_LG, SPACING_SM } from '@modules/common/styles/spacings'

interface Props extends VictoryPieProps {}

const PieChart: React.FC<Props> = (rest) => {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <VictoryPie
        innerRadius={50}
        labels={() => null}
        height={200}
        padding={{ top: 0, bottom: 0, left: 0, right: 0 }}
        colorScale={colors.pieChartColorScale}
        {...rest}
      />
      <VictoryLegend
        colorScale={colors.pieChartColorScale}
        x={SPACING_LG}
        y={SPACING_SM}
        borderPadding={{ top: 0, bottom: 0 }}
        padding={{ top: 0, bottom: 0, left: 0, right: 0 }}
        // TODO
        height={120}
        orientation="vertical"
        style={{
          labels: { fontSize: 20, fill: 'white' }
        }}
        data={rest.data}
      />
    </View>
  )
}

export default PieChart
