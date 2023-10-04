import { View, ViewProps } from 'react-native'

import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'

import styles from './styles'

interface Props {
  style?: ViewProps['style']
  text?: string
  children: React.ReactNode
}

const Card: React.FC<Props> = ({ style, text, children }) => (
  <View style={[styles.container, style]}>
    {text && (
      <Text style={[spacings.mb, textStyles.center, flexbox.flex1]} fontSize={14}>
        {text}
      </Text>
    )}
    {children}
  </View>
)

export default Card
