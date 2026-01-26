import React from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { Key } from '@ambire-common/interfaces/keystore'
import AccountKey from '@common/components/AccountKey'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_LG } from '@common/styles/spacings'
import { Portal } from '@gorhom/portal'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'

import getStyles from './styles'

type Props = {
  type: 'signing' | 'broadcasting'
  selectedAccountKeyStoreKeys: Key[]
  handleChooseKey: (keyAddr: Key['addr'], keyType: Key['type']) => void
  isVisible: boolean
  isSigning: boolean
  handleClose: () => void
  account: Account
}

const SigningKeySelect = ({
  type,
  selectedAccountKeyStoreKeys,
  handleChooseKey,
  isVisible,
  isSigning,
  handleClose,
  account
}: Props) => {
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  const { keys } = useKeystoreControllerState()

  if (!isVisible) return null

  return (
    <Portal hostName="global">
      <Pressable onPress={handleClose} style={styles.overlay} />
      <View
        style={[
          styles.container,
          {
            right: SPACING_LG
          }
        ]}
      >
        <Text style={styles.title} fontSize={16} weight="medium" appearance="secondaryText">
          {type === 'signing' ? t('Select a signing key') : t('Select a fee payer key')}
        </Text>
        <View style={spacings.pvMi}>
          {selectedAccountKeyStoreKeys.map((key, i) => {
            const isImported = keys.some((k) => k.addr === key.addr && k.type === key.type)

            return (
              <Pressable
                key={`${key.addr}-${key.type}`}
                onPress={() => handleChooseKey(key.addr, key.type)}
                disabled={isSigning}
                style={[spacings.pvMi, spacings.phMi, { backgroundColor: theme.primaryBackground }]}
              >
                {({ hovered }: any) => (
                  <AccountKey
                    addr={key.addr}
                    type={key.type}
                    dedicatedToOneSA={key.dedicatedToOneSA}
                    label={key.label || `Key ${i + 1}`}
                    isImported={isImported}
                    enableEditing={false}
                    account={account}
                    keyIconColor={theme.iconPrimary as string}
                    isLast
                    containerStyle={{
                      borderWidth: 1,
                      borderColor: hovered ? theme.primaryBorder : 'transparent',
                      backgroundColor: theme.secondaryBackground
                    }}
                  />
                )}
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
