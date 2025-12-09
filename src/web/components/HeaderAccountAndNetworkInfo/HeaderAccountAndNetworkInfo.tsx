import React, { FC } from 'react'
import { View } from 'react-native'

import { isSmartAccount } from '@ambire-common/libs/account/account'
import AccountAddress from '@common/components/AccountAddress'
import AccountBadges from '@common/components/AccountBadges'
import AmbireLogoHorizontal from '@common/components/AmbireLogoHorizontal'
import AmbireLogoHorizontalWithOG from '@common/components/AmbireLogoHorizontalWithOG/AmbireLogoHorizontalWithOG'
import Avatar from '@common/components/Avatar'
import DomainBadge from '@common/components/Avatar/DomainBadge'
import Text from '@common/components/Text'
import useReverseLookup from '@common/hooks/useReverseLookup'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import Header from '@common/modules/header/components/Header'
import getHeaderStyles from '@common/modules/header/components/Header/styles'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import { getUiType } from '@web/utils/uiType'

import { tabLayoutWidths } from '../TabLayoutWrapper'
import getStyles from './styles'

interface Props {
  withAmbireLogo?: boolean
  withOG?: boolean
  backgroundColor?: string
}

// @TODO: Not renamed because this component will no longer exist in the near future
// @TODO: refactor the header component @petromir.
const HeaderAccountAndNetworkInfo: FC<Props> = ({
  withAmbireLogo = true,
  withOG = false,
  backgroundColor
}) => {
  const { styles: headerStyles } = useTheme(getHeaderStyles)
  const { styles } = useTheme(getStyles)
  const { maxWidthSize } = useWindowSize()
  const { account } = useSelectedAccountControllerState()

  const { isLoading, ens } = useReverseLookup({ address: account?.addr || '' })

  const isActionWindow = getUiType().isActionWindow

  if (!account) return null

  return (
    <Header
      mode="custom"
      withAmbireLogo={!!withAmbireLogo && maxWidthSize(700)}
      style={styles.container}
      backgroundColor={backgroundColor}
    >
      <View
        style={[headerStyles.widthContainer, !isActionWindow && { maxWidth: tabLayoutWidths.xl }]}
      >
        <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1]}>
          <Avatar
            address={account.addr}
            pfp={account.preferences.pfp}
            isSmart={isSmartAccount(account)}
          />
          <View style={flexbox.flex1}>
            <View style={[flexbox.flex1, flexbox.directionRow]}>
              <Text fontSize={16} weight="medium" numberOfLines={1}>
                {account.preferences.label}
              </Text>

              <AccountBadges accountData={account} />
            </View>
            <View style={[flexbox.directionRow, flexbox.alignCenter]}>
              <DomainBadge ens={ens} />
              <AccountAddress isLoading={isLoading} ens={ens} address={account.addr} />
            </View>
          </View>
        </View>
        {!!withAmbireLogo && (maxWidthSize(700) || isActionWindow) && (
          <View style={spacings.pl}>
            {withOG ? <AmbireLogoHorizontalWithOG /> : <AmbireLogoHorizontal />}
          </View>
        )}
      </View>
    </Header>
  )
}

export default React.memo(HeaderAccountAndNetworkInfo)
