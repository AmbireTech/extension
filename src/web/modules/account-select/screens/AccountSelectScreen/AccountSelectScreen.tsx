import React from 'react'
import { Image, Pressable, View } from 'react-native'

import avatarSpace from '@common/assets/images/avatars/avatar-space.png'
import PinIcon from '@common/assets/svg/PinIcon'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import Search from '@common/components/Search'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useMainControllerState from '@web/hooks/useMainControllerState'

import styles from './styles'

// todo: move to utils
const trimAddress = (address: string, maxLength: number) => {
  if (address.length <= maxLength) {
    return address
  }

  const prefixLength = Math.floor((maxLength - 3) / 2)
  const suffixLength = Math.ceil((maxLength - 3) / 2)

  const prefix = address.slice(0, prefixLength)
  const suffix = address.slice(-suffixLength)

  return `${prefix}...${suffix}`
}

const AccountSelectScreen = () => {
  const mainCtrl = useMainControllerState()
  const { dispatch } = useBackgroundService()

  const { t } = useTranslation()

  const selectAccount = (addr: string) => {
    dispatch({
      type: 'MAIN_CONTROLLER_SELECT_ACCOUNT',
      params: { accountAddr: addr }
    })
  }

  return (
    <View style={styles.container}>
      <Search placeholder="Search for accounts" style={styles.searchBar} />
      {mainCtrl.accounts.length &&
        mainCtrl.accounts.map((account) => (
          <Pressable key={account.addr} onPress={() => selectAccount(account.addr)}>
            {({ hovered }: any) => (
              <View
                style={[
                  styles.accountContainer,
                  {
                    borderColor:
                      account.addr === mainCtrl.selectedAccount || hovered
                        ? colors.scampi_20
                        : 'transparent',
                    backgroundColor:
                      account.addr === mainCtrl.selectedAccount || hovered
                        ? colors.melrose_15
                        : 'transparent'
                  }
                ]}
              >
                <View style={[flexboxStyles.directionRow]}>
                  <View style={[spacings.mrTy, flexboxStyles.justifyCenter]}>
                    <Image
                      style={{ width: 30, height: 30, borderRadius: 10 }}
                      source={avatarSpace}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={[spacings.mrTy]}>
                    <Text
                      fontSize={12}
                      weight="regular"
                      color={account.creation ? colors.greenHaze : colors.brownRum}
                    >
                      {trimAddress(account.addr, 25)}
                    </Text>
                    <Text fontSize={12} weight="semiBold">
                      {t('Account label')}
                    </Text>
                  </View>
                  <View style={account.creation ? styles.greenLabel : styles.greyLabel}>
                    <Text
                      weight="regular"
                      fontSize={10}
                      numberOfLines={1}
                      color={account.creation ? colors.greenHaze : colors.brownRum}
                    >
                      {account.creation ? 'Smart Account' : 'Legacy Account'}
                    </Text>
                  </View>
                </View>
                <View style={[flexboxStyles.directionRow, flexboxStyles.alignCenter]}>
                  <PinIcon style={[spacings.mr]} />
                  <SettingsIcon />
                </View>
              </View>
            )}
          </Pressable>
        ))}
    </View>
  )
}

export default AccountSelectScreen
