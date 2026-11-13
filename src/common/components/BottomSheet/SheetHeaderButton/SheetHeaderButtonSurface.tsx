import React, { FC } from 'react'
import { View } from 'react-native'

import useTheme from '@common/hooks/useTheme'
import flexbox from '@common/styles/utils/flexbox'

import { SHEET_HEADER_BUTTON_SIZE } from './constants'

type Props = { children: React.ReactNode }

/** The solid circle behind the icon, where there is no native glass (Android, iOS < 26). */
const SheetHeaderButtonSurface: FC<Props> = ({ children }) => {
  const { theme } = useTheme()

  return (
    <View
      style={[
        flexbox.center,
        {
          width: SHEET_HEADER_BUTTON_SIZE,
          height: SHEET_HEADER_BUTTON_SIZE,
          borderRadius: SHEET_HEADER_BUTTON_SIZE / 2,
          backgroundColor: theme.hoverBackground
        }
      ]}
    >
      {children}
    </View>
  )
}

export default React.memo(SheetHeaderButtonSurface)
