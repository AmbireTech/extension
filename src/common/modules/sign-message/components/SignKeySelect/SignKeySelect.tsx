import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { Key } from '@ambire-common/interfaces/keystore'
import AboveSheetsOverlay from '@common/components/AboveSheetsOverlay'
import AccountKey from '@common/components/AccountKey'
import {
  openBottomSheetsCount,
  useOpenBottomSheetsCount
} from '@common/components/BottomSheet/bottomSheetEventStream'
import { BOTTOM_SHEET_Z_INDEX } from '@common/components/BottomSheet/styles'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_LG } from '@common/styles/spacings'
import { Portal } from '@gorhom/portal'

import getStyles from './styles'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

type Props = {
  type: 'signing' | 'broadcasting'
  selectedAccountKeyStoreKeys: Key[]
  handleChooseKey: (keyAddr: Key['addr'], keyType: Key['type']) => void
  isVisible: boolean
  isSigning: boolean
  handleClose: () => void
  account: Account
}

const selectKeys = (state: AllControllersMappingType['KeystoreController']) => state.keys

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
  const { state: keys } = useController('KeystoreController', selectKeys)

  const openSheetsCount = useOpenBottomSheetsCount()
  // Read non-reactively: the sheets open when this showed, so a later one (the NFC PIN prompt) is known
  const openSheetsCountOnShow = useMemo(
    () => (isVisible ? openBottomSheetsCount.value : 0),
    [isVisible]
  )

  // Drawn above every sheet, so it steps aside while a sheet opened after it is up
  if (!isVisible || openSheetsCount > openSheetsCountOnShow) return null

  return (
    <Portal hostName="global">
      {/* Native sheets present in their own window, which a z-index can't draw above */}
      <AboveSheetsOverlay>
        <Pressable
          onPress={handleClose}
          style={[styles.overlay, { zIndex: BOTTOM_SHEET_Z_INDEX + 1 }]}
        />
        {/* Shares the overlay's zIndex, but renders above it as the later sibling */}
        <View
          style={[
            styles.container,
            { zIndex: BOTTOM_SHEET_Z_INDEX + 1 },
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
                  style={[
                    spacings.pvMi,
                    spacings.phMi,
                    { backgroundColor: theme.primaryBackground }
                  ]}
                >
                  {({ hovered }: any) => (
                    <AccountKey
                      addr={key.addr}
                      type={key.type}
                      dedicatedToOneSA={key.dedicatedToOneSA}
                      isImported={isImported}
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
      </AboveSheetsOverlay>
    </Portal>
  )
}

export default SigningKeySelect
