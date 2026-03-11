import React, { useEffect, useState } from 'react'
import { View, ViewStyle } from 'react-native'

import AccountData from '@common/components/AccountData'
import AccountDataDetailed from '@common/components/AccountDataDetailed'
import AmbireLogoHorizontalWithOG from '@common/components/AmbireLogoHorizontalWithOG'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import { titleChangeEventStream } from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import routesConfig from '@common/modules/router/config/routesConfig'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
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
  style?: ViewStyle
  containerStyle?: ViewStyle
  width?: Width
}) => {
  return (
    <View
      style={[
        spacings.phSm,
        spacings.pvSm,
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
      fontSize={isMobile ? 18 : 20}
      weight="medium"
      style={[
        {
          display: 'flex'
        },
        flexbox.flex1,
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.justifyCenter,
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
  withOG?: boolean
}

const Header = ({
  width,
  withOG,
  withDetailedAccountData
}: CommonHeaderProps & {
  withDetailedAccountData?: boolean
}) => {
  return (
    <Wrapper width={width}>
      {withDetailedAccountData ? <AccountDataDetailed /> : <AccountData />}
      <AmbireLogoHorizontalWithOG withOG={withOG} />
    </Wrapper>
  )
}

const Container = ({
  side,
  style,
  children
}: {
  side: 'left' | 'right'
  style?: ViewStyle
  children?: React.ReactNode
}) => {
  return (
    <View style={[{ flex: 0.5 }, side === 'left' ? flexbox.alignStart : flexbox.alignEnd, style]}>
      {children}
    </View>
  )
}

const HeaderWithTitle = ({
  title: customTitle,
  displayBackButtonIn,
  children,
  withOG,
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
      <Container side="left">
        <HeaderBackButton displayIn={displayBackButtonIn} />
      </Container>
      <Title>{customTitle || title}</Title>
      <Container side="right">
        {children || <AmbireLogoHorizontalWithOG withOG={withOG} />}
      </Container>
    </Wrapper>
  )
}

const HeaderWithLogoOnly = ({ width, withOG }: CommonHeaderProps & { withOG?: boolean }) => {
  return (
    <Wrapper style={flexbox.justifyEnd} width={width}>
      <AmbireLogoHorizontalWithOG withOG={withOG} />
    </Wrapper>
  )
}

// Please don't add 1000 props to the other headers.
// If you need something custom, compose it using these
Header.Wrapper = Wrapper
Header.AccountData = AccountData
Header.AccountDataDetailed = AccountDataDetailed
Header.Title = Title
Header.Container = Container
Header.BackButton = HeaderBackButton
Header.Logo = AmbireLogoHorizontalWithOG

export default Header
export { HeaderWithTitle, HeaderWithLogoOnly, HEADER_HEIGHT }
