import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { Key } from '@ambire-common/interfaces/keystore'
import { ISignAccountOpController } from '@ambire-common/interfaces/signAccountOp'
import AccountKey from '@common/components/AccountKey'
import SafeKeyWrapper from '@common/components/SafeKeyWrapper'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const SafeOwners = ({
  signAccountOpController,
  isWide
}: {
  signAccountOpController: ISignAccountOpController | null
  isWide?: boolean
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { accountStates } = useController('AccountsController').state

  const owners = useMemo(() => {
    if (!signAccountOpController?.account.safeCreation) return []

    const state =
      accountStates[signAccountOpController.accountOp.accountAddr]?.[
        signAccountOpController.accountOp.chainId.toString()
      ]
    if (!state) return []

    const signed = signAccountOpController.accountOp.signed || []
    return state.associatedKeys.map((assKey) => {
      const newKey = signAccountOpController.accountKeyStoreKeys.find((k) => k.addr === assKey)
      if (!newKey)
        return {
          addr: assKey,
          type: 'internal' as Key['type'],
          hasSigned: signed.includes(assKey),
          isImported: false
        }

      return { ...newKey, hasSigned: signed.includes(assKey), isImported: true }
    })
  }, [
    signAccountOpController?.account.safeCreation,
    signAccountOpController?.accountKeyStoreKeys,
    signAccountOpController?.accountOp.signed,
    signAccountOpController?.accountOp.accountAddr,
    signAccountOpController?.accountOp.chainId,
    accountStates
  ])

  if (!signAccountOpController) return null

  return (
    <View style={[flexbox.justifyCenter, flexbox.alignCenter, spacings.mt]}>
      <View style={[flexbox.directionRow, flexbox.justifyCenter, flexbox.alignCenter]}>
        <Text fontSize={16} appearance="primaryText" weight="semiBold">
          {t(`${signAccountOpController.threshold} out of ${owners.length} signatures required:`)}
        </Text>
      </View>
      <View
        style={[
          flexbox.justifyCenter,
          flexbox.alignCenter,
          spacings.mt,
          isWide ? spacings.mbSm : '',
          isWide ? flexbox.directionRow : ''
        ]}
      >
        {owners.map((o, i) => (
          <SafeKeyWrapper
            key={o.addr}
            isDisabled={!o.isImported}
            hasSigned={o.hasSigned}
            style={[
              i === owners.length - 1 && !isWide ? spacings.mb0 : spacings.mbTy,
              isWide && i !== owners.length - 1 ? spacings.mrTy : ''
            ]}
          >
            <AccountKey
              addr={o.addr}
              type={o.type || 'internal'}
              dedicatedToOneSA={false}
              isImported
              account={signAccountOpController.account}
              isLast
              keyIconColor={theme.iconPrimary as string}
              tooltipContent={
                o.hasSigned ? 'Already signed' : o.isImported ? 'Pending to sign' : 'Not imported'
              }
              containerStyle={{
                borderWidth: 1,
                borderColor: 'transparent',
                backgroundColor: theme.secondaryBackground
              }}
            />
          </SafeKeyWrapper>
        ))}
      </View>
    </View>
  )
}

export default SafeOwners
