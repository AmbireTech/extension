import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings, { SPACING_MD } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

interface Styles {
  animation: ViewStyle
  sentEmailText: TextStyle
  waitingEmailConfirmationText: TextStyle
  cancelLoginAttemptText: TextStyle
}

const styles = StyleSheet.create<Styles>({
  animation: spacings.mbLg,
  sentEmailText: {
    ...text.center,
    ...flexbox.alignSelfCenter,
    marginBottom: SPACING_MD * 2,
    maxWidth: 280
  },
  waitingEmailConfirmationText: {
    ...flexbox.alignSelfCenter,
    marginBottom: 60
  },
  cancelLoginAttemptText: flexbox.alignSelfCenter
})

export default styles
