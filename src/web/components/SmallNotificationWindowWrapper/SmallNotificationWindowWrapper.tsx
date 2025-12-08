import React, { FC } from 'react'
import { View } from 'react-native'

type Props = {
  children: React.ReactNode
}

const SmallNotificationWindowWrapper: FC<Props> = ({ children }) => {
  return (
    <View
      style={{
        flex: 1,
        // Even the the request window is created with a width of 720px
        // it is not guaranteed that the page will be 720px wide
        // as the user may have zoomed in or out.
        // That's why we set a higher maxWidth
        // to ensure that most users won't see white space on the sides
        maxWidth: 1280,
        width: '100%',
        marginHorizontal: 'auto'
      }}
    >
      {children}
    </View>
  )
}

export default SmallNotificationWindowWrapper
