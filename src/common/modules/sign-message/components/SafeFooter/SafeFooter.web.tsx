import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GestureResponderEvent, View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { Key } from '@ambire-common/interfaces/keystore'
import Button from '@common/components/Button'
import GlassView from '@common/components/GlassView'
import Spinner from '@common/components/Spinner'
import useCompactActionRequestLayout from '@common/modules/action-requests/hooks/useCompactActionRequestLayout'
import SafeOwners from '@common/modules/sign-account-op/components/SafeOwners'
import spacings, { SPACING, SPACING_SM, SPACING_TY } from '@common/styles/spacings'
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
  const { isCompactLayout } = useCompactActionRequestLayout()
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

  if (isCompactLayout) {
    return (
      <View style={[spacings.ptSm, spacings.phSm, spacings.pbMd]}>
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
            style={spacings.mb}
          />
        )}
        {threshold === 0 && (
          <Button
            text={t('Reject')}
            type="danger"
            hasBottomSpacing={false}
            size="large"
            onPress={onReject}
          />
        )}
        {threshold > 0 && isSingle && (
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

  return (
    <View style={[isSingle ? flexbox.alignCenter : '', spacings.pb, spacings.ph]}>
      <GlassView borderRadius={28} cssStyle={{ flexDirection: 'column', paddingBottom: SPACING }}>
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
          <View style={[flexbox.directionRow, flexbox.justifyCenter, spacings.pt, spacings.ph]}>
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
          <View style={[flexbox.directionRow, flexbox.justifyCenter, spacings.pt, spacings.ph]}>
            <View style={[flexbox.directionRow]}>
              <Button
                text={t('Reject')}
                type="danger"
                hasBottomSpacing={false}
                size="large"
                onPress={onReject}
                style={[{ maxWidth: 'auto' }]}
              />
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
          <View style={[flexbox.directionRow, flexbox.justifyCenter, spacings.pt, spacings.ph]}>
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
