import React, { useEffect, useState } from 'react'
import { View, ViewProps } from 'react-native'

import AccountData from '@common/components/AccountData'
import Text from '@common/components/Text'
import { titleChangeEventStream } from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import routesConfig from '@common/modules/router/config/routesConfig'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import AmbireSmallWhiteLogo from '@web/components/AmbireSmallWhiteLogo'
import { tabLayoutWidths } from '@web/components/TabLayoutWrapper'

import HeaderBackButton, { DisplayIn } from '../HeaderBackButton'

type Width = 'sm' | 'md' | 'lg' | 'xl' | 'full'

const HEADER_HEIGHT = 60

const Wrapper = ({
  children,
  style,
  containerStyle,
  width = 'xl'
}: {
  children?: React.ReactNode
  style?: ViewProps
  containerStyle?: ViewProps
  width?: Width
}) => {
  return (
    <View
      style={[
        spacings.phSm,
        spacings.pbSm,
        spacings.ptMd,
        {
          width: '100%'
        },
        containerStyle
      ]}
    >
      <View
        style={[
          flexbox.directionRow,
          flexbox.justifySpaceBetween,
          flexbox.alignCenter,
          { maxWidth: Number(tabLayoutWidths[width]), width: '100%', marginHorizontal: 'auto' },
          style
        ]}
      >
        {children}
      </View>
    </View>
  )
}

const Title = ({ children }: { children: React.ReactNode }) => {
  return (
    <Text
      fontSize={20}
      weight="medium"
      style={[
        flexbox.flex1,
        {
          textAlign: 'center'
        }
      ]}
    >
      {children}
    </Text>
  )
}

type CommonHeaderProps = {
  width?: Width
}

// TODO: OG Mode
const Header = ({ width }: CommonHeaderProps) => {
  return (
    <Wrapper width={width}>
      <AccountData />
      <AmbireSmallWhiteLogo />
    </Wrapper>
  )
}

const HeaderWithTitle = ({
  title: customTitle,
  displayBackButtonIn,
  children,
  width
}: {
  title?: string
  displayBackButtonIn?: DisplayIn | DisplayIn[]
  children?: React.ReactNode
} & CommonHeaderProps) => {
  const [title, setTitle] = useState('')
  const { path } = useRoute()

  useEffect(() => {
    if (!path) return

    const nextRoute = path?.substring(1)
    setTitle((routesConfig as any)?.[nextRoute]?.title || '')
  }, [path])

  useEffect(() => {
    const subscription = titleChangeEventStream!.subscribe({ next: (v) => setTitle(v) })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <Wrapper width={width}>
      <View style={[flexbox.flex1, flexbox.alignStart]}>
        <HeaderBackButton displayIn={displayBackButtonIn} />
      </View>
      <Title>{customTitle || title}</Title>
      <View style={[flexbox.flex1, flexbox.alignEnd]}>{children || <AmbireSmallWhiteLogo />}</View>
    </Wrapper>
  )
}

const HeaderWithLogoOnly = ({ width }: CommonHeaderProps) => {
  return (
    <Wrapper style={flexbox.justifyEnd} width={width}>
      <AmbireSmallWhiteLogo />
    </Wrapper>
  )
}

// Please don't add 1000 props to the other headers.
// If you need something custom, compose it using these
Header.Wrapper = Wrapper
Header.AccountData = AccountData
Header.Title = Title
Header.BackButton = HeaderBackButton
Header.Logo = AmbireSmallWhiteLogo

export default Header
export { HeaderWithTitle, HeaderWithLogoOnly, HEADER_HEIGHT }
