import React from 'react'
import { StyleSheet, View } from 'react-native'

import AmbireLogoHorizontal from '@common/components/AmbireLogoHorizontal'
import Spinner from '@common/components/Spinner'
import flexbox from '@common/styles/utils/flexbox'

const Splash = () => {
  return (
    <View style={[StyleSheet.absoluteFill, flexbox.center]}>
      <View style={[flexbox.alignCenter, flexbox.justifyCenter]}>
        <AmbireLogoHorizontal width={300} height={96} />
        <View style={[{ position: 'absolute', bottom: -56 }]}>
          <Spinner style={{ width: 26, height: 26 }} />
        </View>
      </View>
    </View>
  )
}

export default React.memo(Splash)
