import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { Key } from '@ambire-common/interfaces/keystore'
import AccountKey from '@common/components/AccountKey'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import Checkbox from '@common/components/Checkbox'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_LG } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { Portal } from '@gorhom/portal'

import getStyles from './styles'

type Props = {
  handleSetMultisigSigners: (signers: { addr: Key['addr']; type: Key['type'] }[]) => void
  isVisible: boolean
  isSigning: boolean
  handleClose: () => void
  account: Account
  signed: string[]
  selectedAccountKeyStoreKeys: Key[]
  threshold: number
}

const MultipleSignersSelect = ({
  handleSetMultisigSigners,
  isVisible,
  isSigning,
  handleClose,
  account,
  signed,
  selectedAccountKeyStoreKeys,
  threshold
}: Props) => {
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  const [selectedSigners, setSelectedSigners] = useState<
    { addr: Key['addr']; type: Key['type'] }[]
  >([])

  const onSignerSelected = useCallback(
    (owner: { addr: Key['addr']; type: Key['type'] }) => {
      const added = selectedSigners.find((s) => s.addr === owner.addr && s.type === owner.type)
      if (!added) setSelectedSigners([...selectedSigners, owner])
      else
        setSelectedSigners(
          [...selectedSigners].filter((s) => !(s.addr === owner.addr && s.type === owner.type))
        )
    },
    [selectedSigners]
  )

  const notSigned = useMemo(() => {
    return selectedAccountKeyStoreKeys.filter((k) => !signed.includes(k.addr))
  }, [selectedAccountKeyStoreKeys, signed])

  const leftThreshold = useMemo(() => {
    return threshold - signed.length
  }, [threshold, signed])

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
        <View style={[styles.title, flexbox.directionRow, flexbox.justifySpaceBetween]}>
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <Text fontSize={16} weight="medium" appearance="secondaryText">
              {t('Select signers')}
            </Text>
            <Text
              fontSize={16}
              weight="medium"
              appearance={selectedSigners.length === leftThreshold ? 'successText' : 'errorText'}
            >
              ({selectedSigners.length})
            </Text>
          </View>
          <Text fontSize={16} weight="medium" appearance="secondaryText">
            {leftThreshold} / {notSigned.length}
          </Text>
        </View>
        <View>
          {notSigned.map((key, i) => {
            return (
              <Checkbox
                key={`${key.addr}-${key.type}`}
                value={!!selectedSigners.find((s) => s.addr === key.addr && s.type === key.type)}
                onValueChange={() => onSignerSelected(notSigned[i]!)}
                style={[flexbox.directionRow, flexbox.alignCenter]}
                uncheckedBorderColor={theme.iconPrimary}
              >
                <AccountKey
                  addr={key.addr}
                  type={key.type}
                  dedicatedToOneSA={false}
                  isImported
                  account={account}
                  isLast={true}
                  keyIconColor={theme.iconPrimary as string}
                  containerStyle={{
                    borderWidth: 1,
                    borderColor: 'transparent',
                    backgroundColor: theme.secondaryBackground
                  }}
                />
              </Checkbox>
            )
          })}
        </View>
        <ButtonWithLoader
          testID="sign-safe-button"
          text={t('Sign')}
          isLoading={isSigning}
          disabled={selectedSigners.length !== leftThreshold}
          onPress={() => handleSetMultisigSigners(selectedSigners)}
          style={spacings.ml0}
          size="small"
        />
      </View>
    </Portal>
  )
}

export default MultipleSignersSelect
