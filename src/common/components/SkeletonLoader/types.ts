import { ViewStyle } from 'react-native'

import { ThemeProps } from '@common/styles/themeConfig'

interface Props {
  width: ViewStyle['width']
  height: ViewStyle['height']
  borderRadius?: number
  style?: React.CSSProperties | ViewStyle
  lowOpacity?: boolean
  appearance?: keyof ThemeProps
}

export { type Props as SkeletonLoaderProps }
