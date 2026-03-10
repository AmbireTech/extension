import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { Key } from '@ambire-common/interfaces/keystore'
import AccountKey from '@common/components/AccountKey'
import SafeKeyWrapper from '@common/components/SafeKeyWrapper'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

const SafeOwners = ({
  account,
  onSign,
  isSignLoading,
  signingKeyAddr,
  chainId,
  signed = [],
  importedKeys,
  threshold
}: {
  account: Account
  onSign?: (signingKeyAddr: Key['addr'], _chosenSigningKeyType: Key['type']) => void
  isSignLoading: boolean
  signingKeyAddr: string | null
  chainId: string
  signed: string[]
  importedKeys: Key[]
  threshold: number
}) => {
  const { t } = useTranslation()
  const { theme, themeType } = useTheme()
  const { accountStates } = useController('AccountsController').state

  const owners = useMemo(() => {
    const state = accountStates[account.addr]?.[chainId]
    if (!state) return []

    return state.associatedKeys
      .map((assKey) => {
        const newKey = importedKeys.find((k) => k.addr === assKey)
        if (!newKey)
          return {
            addr: assKey,
            type: 'internal' as Key['type'],
            hasSigned: signed.includes(assKey),
            isImported: false
          }

        return { ...newKey, hasSigned: signed.includes(assKey), isImported: true }
      })
      .sort((a, b) => {
        if (a.isImported && !b.isImported) return -1
        if (!a.isImported && b.isImported) return 1
        return 0
      })
  }, [importedKeys, account.addr, chainId, accountStates, signed])

  const hasOneFromAllSigned = useMemo(() => {
    return !!owners.find((o) => o.hasSigned)
  }, [owners])

  return (
    <View style={[flexbox.justifyCenter, flexbox.alignCenter, spacings.mtTy]}>
      <View style={[flexbox.directionRow, flexbox.justifyCenter, flexbox.alignCenter]}>
        <Text fontSize={16} appearance="primaryText" weight="semiBold">
          {t(`${threshold} out of ${owners.length} signatures required:`)}
        </Text>
      </View>
      <View style={[flexbox.justifyCenter, flexbox.alignCenter, spacings.mt, { width: '100%' }]}>
        {owners.map((o, i) => (
          <SafeKeyWrapper
            key={o.addr}
            isDisabled={!o.isImported}
            hasSigned={o.hasSigned}
            addr={o.addr}
            type={o.type}
            isQueued={hasOneFromAllSigned}
            style={[i === owners.length - 1 ? spacings.mb0 : spacings.mbTy, { width: '100%' }]}
            onSign={onSign}
            isSignLoading={isSignLoading && signingKeyAddr === o.addr}
          >
            <AccountKey
              addr={o.addr}
              label={o.addr}
              type={o.type || 'internal'}
              dedicatedToOneSA={false}
              isImported
              account={account}
              isLast
              keyIconColor={theme.neutral600 as string}
              tooltipContent={o.hasSigned ? 'Signed' : o.isImported ? 'Pending' : 'Not imported'}
              itemHeight={38}
              containerStyle={{
                borderWidth: 1,
                borderColor: 'transparent',
                backgroundColor: themeType === THEME_TYPES.LIGHT ? '#fff' : '#000'
              }}
            />
          </SafeKeyWrapper>
        ))}
      </View>
    </View>
  )
}

export default SafeOwners
