import React from 'react'

import {
  HumanizerErc7730Visualization,
  HumanizerVisualization
} from '@ambire-common/libs/humanizer/interfaces'
import { Erc7730Row } from '@common/components/HumanizedVisualization/Erc7730/interfaces'

export interface Props {
  item: HumanizerErc7730Visualization & { id: number }
  summaryRows: Erc7730Row[]
  spenderRow?: Erc7730Row
  sizeMultiplierSize: number
  textSize: number
  hideTitle?: boolean
  renderValue: (valueItem: HumanizerVisualization, overrideTextSize?: number) => React.ReactNode
}

declare const MobileErc7730SummaryVisualization: React.FC<Props>

export default MobileErc7730SummaryVisualization
