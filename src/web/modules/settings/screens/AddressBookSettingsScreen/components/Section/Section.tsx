import { FC, ReactNode } from 'react'
import { View } from 'react-native'

import flexbox from '@common/styles/utils/flexbox'
import SettingsPageHeader from '@web/modules/settings/components/SettingsPageHeader'

const Section: FC<{
  title: string
  children: ReactNode | ReactNode[]
  headerChildren?: ReactNode | ReactNode[]
}> = ({ title, children, headerChildren }) => {
  return (
    <View style={flexbox.flex1}>
      <SettingsPageHeader title={title}>{headerChildren}</SettingsPageHeader>
      {children}
    </View>
  )
}

export default Section
