import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GestureResponderEvent, View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { Key } from '@ambire-common/interfaces/keystore'
import Button from '@common/components/Button'
import Spinner from '@common/components/Spinner'
import ActionsPagination from '@common/modules/action-requests/components/ActionsPagination'
import SafeOwners from '@common/modules/sign-account-op/components/SafeOwners'
import spacings, { SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const SafeFooter = ({
  account,
  onSign,
  isSignLoading,
  signingKeyAddr,
  chainId,
  signed = [],
  importedKeys,
  threshold,
  onReject,
  onSignLater
}: {
  account: Account
  onSign?: (signingKeyAddr: Key['addr'], _chosenSigningKeyType: Key['type']) => void
  isSignLoading: boolean
  signingKeyAddr: string | null
  chainId: string
  signed: string[]
  importedKeys: Key[]
  threshold: number
  onReject: (event: GestureResponderEvent) => void
  // closes the signing UI while keeping the request pending with the collected
  // signatures already pushed to Safe Global (dismisses the sheet)
  onSignLater: () => void
}) => {
  const { t } = useTranslation()
  const [showSafeSigners, setShowSafeSigners] = useState(false)

  const isSingle = useMemo(() => {
    return threshold === 1 && importedKeys.length === 1
  }, [threshold, importedKeys.length])

  const onSingleSignerSign = useCallback(() => {
    if (!isSingle || !onSign) return
    const signer = importedKeys[0]
    if (!signer) return
    onSign(signer.addr, signer.type)
  }, [isSingle, onSign, importedKeys])

  return (
    <View style={[spacings.ptSm, spacings.phSm]}>
      {showSafeSigners && (
        <SafeOwners
          account={account}
          isSignLoading={isSignLoading}
          onSign={onSign}
          chainId={chainId}
          signed={signed}
          importedKeys={importedKeys}
          threshold={threshold}
          signingKeyAddr={signingKeyAddr}
          style={spacings.mbXl}
        />
      )}
      {threshold === 0 && (
        <View style={[flexbox.directionRow, { columnGap: SPACING_TY }]}>
          <View style={flexbox.flex1}>
            <Button
              text={t('Reject')}
              type="danger"
              hasBottomSpacing={false}
              size="large"
              onPress={onReject}
            />
          </View>
        </View>
      )}
      {threshold > 0 && isSingle && (
        <>
          <View style={[flexbox.directionRow, { columnGap: SPACING_TY }]}>
            <View style={flexbox.flex1}>
              <Button
                text={t('Reject')}
                type="danger"
                hasBottomSpacing={false}
                size="large"
                onPress={onReject}
              />
            </View>
            <View style={flexbox.flex1}>
              <Button
                size="large"
                type="primary"
                hasBottomSpacing={false}
                onPress={onSingleSignerSign}
                text="Sign"
              />
            </View>
          </View>
          <ActionsPagination />
        </>
      )}
      {threshold > 0 &&
        !isSingle &&
        (threshold > signed.length ? (
          <>
            <View style={spacings.mbSm}>
              <Button
                key={showSafeSigners ? 'close-signing' : 'begin-signing'}
                size="large"
                type="primary"
                hasBottomSpacing={false}
                onPress={() => setShowSafeSigners((prev) => !prev)}
                text={!showSafeSigners ? 'Begin signing' : 'Close signing'}
              />
            </View>
            <View style={[flexbox.directionRow, { columnGap: SPACING_SM }]}>
              <View style={flexbox.flex1}>
                <Button
                  text={t('Reject')}
                  type="danger"
                  hasBottomSpacing={false}
                  onPress={onReject}
                  style={{ height: 50 }}
                />
              </View>
              <View style={flexbox.flex1}>
                <Button
                  type="secondary"
                  hasBottomSpacing={false}
                  onPress={onSignLater}
                  text={t('Sign later')}
                  disabled={signed.length === 0}
                  style={{ height: 50 }}
                />
              </View>
            </View>
            <ActionsPagination />
          </>
        ) : (
          <View style={flexbox.center}>
            <Spinner
              style={{
                width: 28,
                height: 28,
                marginTop: 14,
                marginBottom: 14
              }}
            />
          </View>
        ))}
    </View>
  )
}

export default React.memo(SafeFooter)
