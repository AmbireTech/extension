import {
  HumanizerErc7730Visualization,
  HumanizerVisualization
} from '@ambire-common/libs/humanizer/interfaces'

export type Erc7730Visualization = HumanizerVisualization & HumanizerErc7730Visualization

const isErc7730Visualization = (
  item: HumanizerVisualization | undefined
): item is Erc7730Visualization => item?.type === 'erc7730'

export default isErc7730Visualization
