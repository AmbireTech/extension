import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GestureResponderEvent, ScrollView, View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { Key } from '@ambire-common/interfaces/keystore'
import Button from '@common/components/Button'
import GlassView from '@common/components/GlassView'
import SpinnerWeb from '@common/components/Spinner/Spinner.web'
import ActionsPagination from '@common/modules/action-requests/components/ActionsPagination'
import SafeOwners from '@common/modules/sign-account-op/components/SafeOwners'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { closeCurrentWindow } from '@web/extension-services/background/webapi/window'

const SafeFooter = ({
  account,
  onSign,
  isSignLoading,
  signingKeyAddr,
  chainId,
  signed = [],
  importedKeys,
  threshold,
  onReject
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
}) => {
  const { t } = useTranslation()
  const [showSafeSigners, setShowSafeSigners] = useState(false)

  return (
    <View style={[spacings.pbMd, spacings.ph]}>
      <GlassView borderRadius={28} cssStyle={{ flexDirection: 'column' }}>
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
                  onPress={() => closeCurrentWindow()}
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
            <SpinnerWeb
              style={{
                width: 28,
                height: 28,
                marginTop: 14,
                marginBottom: 14
              }}
            />
          )}
        </View>
      </GlassView>
    </View>
  )
}

export default React.memo(SafeFooter)
