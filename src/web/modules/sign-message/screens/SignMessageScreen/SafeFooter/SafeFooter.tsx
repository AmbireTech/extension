import React from 'react'
import { useTranslation } from 'react-i18next'
import { GestureResponderEvent, ScrollView, View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { Key } from '@ambire-common/interfaces/keystore'
import Button from '@common/components/Button'
import GlassView from '@common/components/GlassView'
import SpinnerWeb from '@common/components/Spinner/Spinner.web'
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

  return (
    <View style={[spacings.pbMd, spacings.phMd]}>
      <GlassView borderRadius={28} cssStyle={{ flexDirection: 'column' }}>
        <ScrollView style={[{ maxHeight: 140 }, spacings.mbMd, spacings.phMd]}>
          <SafeOwners
            account={account}
            isSignLoading={isSignLoading}
            onSign={onSign}
            chainId={chainId}
            signed={signed}
            importedKeys={importedKeys}
            threshold={threshold}
            signingKeyAddr={signingKeyAddr}
          />
        </ScrollView>
        <View style={[flexbox.directionRow, flexbox.justifyCenter, spacings.pbSm]}>
          {threshold > signed.length ? (
            <View style={[flexbox.directionRow]}>
              <Button
                text={t('Reject')}
                type="danger"
                hasBottomSpacing={false}
                size="large"
                onPress={onReject}
                style={[{ maxWidth: 100 }]}
              />
              <Button
                size="large"
                type="secondary"
                hasBottomSpacing={false}
                onPress={() => closeCurrentWindow()}
                text={'Close'}
                disabled={signed.length === 0}
                style={[{ maxWidth: 100 }, spacings.ml]}
              />
            </View>
          ) : (
            <SpinnerWeb style={{ width: 28, height: 28, marginTop: 14, marginBottom: 14 }} />
          )}
        </View>
      </GlassView>
    </View>
  )
}

export default React.memo(SafeFooter)
