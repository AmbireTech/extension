import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GestureResponderEvent, View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { Key } from '@ambire-common/interfaces/keystore'
import Button from '@common/components/Button'
import GlassView from '@common/components/GlassView'
import Spinner from '@common/components/Spinner'
import ActionsPagination from '@common/modules/action-requests/components/ActionsPagination'
import SafeOwners from '@common/modules/sign-account-op/components/SafeOwners'
import spacings from '@common/styles/spacings'
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
  // closes the signing UI while keeping the txn pending with the collected
  // signatures already pushed to Safe Global (web: close popup; mobile: dismiss sheet)
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
    <View style={[isSingle ? flexbox.alignCenter : '', spacings.pbMd, spacings.ph]}>
      <GlassView borderRadius={28} cssStyle={!isSingle ? { flexDirection: 'column' } : {}}>
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
            style={{ ...spacings.ptLg, ...spacings.ph }}
          />
        )}
        {threshold === 0 && (
          <View style={[flexbox.directionRow, flexbox.justifyCenter, spacings.pv, spacings.ph]}>
            <Button
              text={t('Reject')}
              type="danger"
              hasBottomSpacing={false}
              size="large"
              onPress={onReject}
              style={[{ maxWidth: 'auto' }]}
            />
          </View>
        )}
        {threshold > 0 && isSingle ? (
          <View style={[flexbox.directionRow, flexbox.justifyCenter, spacings.pv, spacings.ph]}>
            <View style={[flexbox.directionRow]}>
              <Button
                text={t('Reject')}
                type="danger"
                hasBottomSpacing={false}
                size="large"
                onPress={onReject}
                style={[{ maxWidth: 'auto' }]}
              />
              <ActionsPagination />
              <Button
                size="large"
                type="primary"
                hasBottomSpacing={false}
                onPress={onSingleSignerSign}
                text={'Sign'}
                style={[{ maxWidth: 'auto' }, spacings.ml]}
              />
            </View>
          </View>
        ) : threshold > 0 ? (
          <View style={[flexbox.directionRow, flexbox.justifyCenter, spacings.pv, spacings.ph]}>
            {threshold > signed.length ? (
              <View style={[flexbox.directionRow, flexbox.justifySpaceBetween, { width: '100%' }]}>
                <Button
                  text={t('Reject')}
                  type="danger"
                  hasBottomSpacing={false}
                  size="large"
                  onPress={onReject}
                  style={[{ maxWidth: 'auto' }]}
                />
                <ActionsPagination />
                <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                  <Button
                    size="large"
                    type="secondary"
                    hasBottomSpacing={false}
                    onPress={onSignLater}
                    text={'Sign later'}
                    disabled={signed.length === 0}
                    style={[{ maxWidth: 'auto' }]}
                  />
                  <Button
                    size="large"
                    type="primary"
                    hasBottomSpacing={false}
                    onPress={() => setShowSafeSigners((prev) => !prev)}
                    text={!showSafeSigners ? 'Begin signing' : 'Close signing'}
                    style={[{ maxWidth: 'auto' }, spacings.ml]}
                  />
                </View>
              </View>
            ) : (
              <Spinner
                style={{
                  width: 28,
                  height: 28,
                  marginTop: 14,
                  marginBottom: 14
                }}
              />
            )}
          </View>
        ) : null}
      </GlassView>
    </View>
  )
}

export default React.memo(SafeFooter)
