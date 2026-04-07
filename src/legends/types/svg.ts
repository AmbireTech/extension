import { SvgProps } from 'react-native-svg'

export type LegendsSvgProps = SvgProps & {
  className?: string
  onClick?: () => any
  'data-tooltip-id'?: string
  dataSet?: any
}
