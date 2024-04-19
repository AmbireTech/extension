import React from 'react'
import { Pressable, View } from 'react-native'

import { Key } from '@ambire-common/interfaces/keystore'
import AccountKey from '@common/components/AccountKey'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import { Portal } from '@gorhom/portal'
import { getTabLayoutPadding } from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import useSettingsControllerState from '@web/hooks/useSettingsControllerState'

import getStyles from './styles'

type Props = {
  selectedAccountKeyStoreKeys: Key[]
  handleChangeSigningKey: (keyAddr: Key['addr'], keyType: Key['type']) => void
  isVisible: boolean
  isSigning: boolean
  handleClose: () => void
}

const SigningKeySelect = ({
  selectedAccountKeyStoreKeys,
  handleChangeSigningKey,
  isVisible,
  isSigning,
  handleClose
}: Props) => {
  const { theme, styles } = useTheme(getStyles)
  const { maxWidthSize } = useWindowSize()
  const settingsCtrl = useSettingsControllerState()
  const { keys } = useKeystoreControllerState()

  if (!isVisible) return null

  return (
    <Portal hostName="global">
      <Pressable onPress={handleClose} style={styles.overlay} />
      <View
        style={[
          styles.container,
          {
            right: getTabLayoutPadding(maxWidthSize).paddingHorizontal
          }
        ]}
      >
        <Text style={styles.title} fontSize={16} weight="medium" appearance="secondaryText">
          Select a signing key
        </Text>
        <View>
          {selectedAccountKeyStoreKeys.map((key, i) => {
            const { label } =
              settingsCtrl.keyPreferences.find((x) => x.addr === key.addr && x.type === key.type) ||
              {}
            const isImported = keys.some((k) => k.addr === key.addr && k.type === key.type)

            return (
              <Pressable
                onPress={() => handleChangeSigningKey(key.addr, key.type)}
                style={({ hovered }: any) => ({
                  backgroundColor: hovered ? theme.secondaryBackground : 'transparent'
                })}
                disabled={isSigning}
              >
                <AccountKey
                  addr={key.addr}
                  type={key.type}
                  label={label || `Key ${i + 1}`}
                  isLast={i === selectedAccountKeyStoreKeys.length - 1}
                  isImported={isImported}
                  enableEditing={false}
                />
              </Pressable>
            )
          })}
          {isSigning && (
            <View style={styles.spinner}>
              <Spinner />
            </View>
          )}
        </View>
      </View>
    </Portal>
  )
}

export default SigningKeySelect
