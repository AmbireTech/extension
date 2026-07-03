import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View, ViewStyle } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { ConnectionSource, Dapp } from '@ambire-common/interfaces/dapp'
import GlobeIcon from '@common/assets/svg/GlobeIcon'
import WalletConnectIcon from '@common/assets/svg/WalletConnectIcon'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import NetworkIcon from '@common/components/NetworkIcon'
import AccountOption from '@common/components/Option/AccountOption'
import Select from '@common/components/Select'
import { SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import { AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import DappItem from '@common/modules/explore/components/DappItem'
import AccountPreferencesBottomSheet from '@common/modules/explore/components/ManageApp/AccountPreferencesBottomSheet'
import useManageApp from '@common/modules/explore/hooks/useManageApp'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface ManageAppProps {
  dapp: Dapp
  children: React.ReactNode
  isParentHovered?: boolean
  buttonProps?: Omit<React.ComponentProps<typeof Pressable>, 'onPress' | 'ref'>
  style?: ViewStyle
  onClosed?: () => void
}

const ManageApp = ({ dapp, children, buttonProps, style = {}, onClosed }: ManageAppProps) => {
  const { theme } = useTheme()
  const { account, accounts, networks, onDisconnect, onSelectNetwork } = useManageApp(dapp)
  const { ref: sheetRef, open, close } = useModalize()
  const {
    ref: disconnectChooserRef,
    open: openDisconnectChooser,
    close: closeDisconnectChooser
  } = useModalize()
  const {
    ref: accountPreferencesRef,
    open: openAccountPreferences,
    close: closeAccountPreferences
  } = useModalize()
  const { t } = useTranslation()
  const { dispatch: mainDispatch } = useController('MainController')
  const {
    state: { account: selectedAccount }
  } = useController('SelectedAccountController')

  const connectedSources = dapp.connectedSources ?? []
  const hasMultipleSources = connectedSources.length > 1

  const handleDisconnect = useCallback(
    (source?: ConnectionSource) => {
      onDisconnect(source)
      closeDisconnectChooser()
      close()
    },
    [onDisconnect, closeDisconnectChooser, close]
  )

  const onPressDisconnect = useCallback(() => {
    if (hasMultipleSources) {
      openDisconnectChooser()
      return
    }
    onDisconnect()
    close()
  }, [hasMultipleSources, openDisconnectChooser, onDisconnect, close])

  const networksOptions: SelectValue[] = useMemo(
    () =>
      networks.map((n) => ({
        value: n.chainId.toString(),
        label: (
          <Text weight="medium" fontSize={14} numberOfLines={1}>
            {n.name}
          </Text>
        ),
        icon: <NetworkIcon size={24} id={n.chainId.toString()} />
      })),
    [networks]
  )

  const selectedNetwork = useMemo(
    () => networksOptions.find((o) => o.value === dapp.chainId?.toString()),
    [networksOptions, dapp.chainId]
  )

  const handleSetNetwork = useCallback(
    (option: SelectValue) => {
      onSelectNetwork(BigInt(option.value))
    },
    [onSelectNetwork]
  )

  const accountsOptions: SelectValue[] = useMemo(
    () =>
      accounts.map((acc) => ({
        value: acc.addr,
        label: <AccountOption acc={acc} />
      })),
    [accounts]
  )

  // On web the dapp can be scoped to a subset of accounts. The account it "sees" is the
  // currently selected one when it's part of the allowed list, otherwise the last selected
  // account that was active during the dapp session.
  const connectedAccount = useMemo(() => {
    const preferences = dapp.accountPreferences

    if (preferences?.enabled && account && !preferences.accounts.includes(account.addr)) {
      return accounts.find((acc) => acc.addr === preferences.selectedAccount) ?? account
    }

    return account
  }, [dapp.accountPreferences, account, accounts])

  const handleSelectAccount = useCallback(
    (option: SelectValue) => {
      const addr = option.value

      if (selectedAccount?.addr !== addr) {
        mainDispatch({
          type: 'method',
          params: { method: 'selectAccount', args: [addr as string] }
        })
      }
    },
    [mainDispatch, selectedAccount]
  )

  return (
    <>
      <AnimatedPressable
        onPress={open}
        hitSlop={{ top: 8, bottom: 8, left: 10, right: 10 }}
        {...(buttonProps as any)}
      >
        {children}
      </AnimatedPressable>

      <BottomSheet
        id="manage-app"
        sheetRef={sheetRef}
        closeBottomSheet={close}
        onClosed={onClosed}
        adjustToContentHeight
        style={style}
      >
        <Text weight="semiBold" fontSize={18} style={[spacings.mb, { textAlign: 'center' }]}>
          {t('Manage app')}
        </Text>

        <View style={spacings.mbSm}>
          <DappItem {...dapp} isInSettings onPressOverride={() => {}} />
        </View>

        {isMobile && connectedSources.length > 0 && (
          <View style={spacings.mbSm}>
            <Text fontSize={14} appearance="secondaryText" style={spacings.mbMi}>
              {t(connectedSources.length > 1 ? 'Connections' : 'Connection')}
            </Text>
            <View style={[flexbox.directionRow, { columnGap: SPACING_SM }]}>
              {connectedSources.includes('injected') && (
                <View
                  style={[
                    flexbox.directionRow,
                    flexbox.alignCenter,
                    common.borderRadiusPrimary,
                    { backgroundColor: theme.secondaryBackground, height: 50 },
                    spacings.ph
                  ]}
                >
                  <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                    <GlobeIcon width={20} height={20} />
                    <Text
                      fontSize={14}
                      style={spacings.mlTy}
                      weight="medium"
                      appearance="secondaryText"
                    >
                      {t('In-app browser')}
                    </Text>
                  </View>
                </View>
              )}
              {connectedSources.includes('wc') && (
                <View
                  style={[
                    flexbox.directionRow,
                    flexbox.alignCenter,
                    common.borderRadiusPrimary,
                    { backgroundColor: theme.secondaryBackground, height: 50 },
                    spacings.ph
                  ]}
                >
                  <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                    <WalletConnectIcon width={22} height={22} />
                    <Text
                      fontSize={14}
                      style={spacings.mlTy}
                      weight="medium"
                      appearance="secondaryText"
                    >
                      {t('WC')}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        <Select
          value={selectedNetwork}
          setValue={handleSetNetwork}
          options={networksOptions}
          label={t('Chain')}
          withSearch
          bottomSheetTitle={t('Chain')}
          selectStyle={{ backgroundColor: theme.tertiaryBackground }}
        />

        {isMobile && !!account && (
          <Select
            value={{
              value: account.addr,
              label: <AccountOption acc={account} />
            }}
            setValue={handleSelectAccount}
            options={accountsOptions}
            label={t('Account')}
            selectStyle={{ backgroundColor: theme.tertiaryBackground }}
          />
        )}

        {isWeb && !!connectedAccount && (
          <View style={spacings.mbSm}>
            <Text fontSize={14} appearance="secondaryText" style={spacings.mbMi}>
              {t('Account')}
            </Text>
            <View style={[flexbox.directionRow, flexbox.alignCenter]}>
              <View
                style={[
                  flexbox.flex1,
                  flexbox.directionRow,
                  flexbox.alignCenter,
                  common.borderRadiusPrimary,
                  spacings.ph,
                  { backgroundColor: theme.tertiaryBackground, height: 50 }
                ]}
              >
                <AccountOption acc={connectedAccount} />
              </View>
              <Button
                type="tertiary"
                text={t('Manage')}
                onPress={() => openAccountPreferences()}
                hasBottomSpacing={false}
                style={{ ...spacings.mlSm, height: 50 }}
              />
            </View>
          </View>
        )}

        {connectedSources.length > 0 && (
          <Button
            type="danger"
            text={t('Disconnect')}
            onPress={onPressDisconnect}
            hasBottomSpacing={false}
            style={spacings.mtSm}
          />
        )}
      </BottomSheet>

      <BottomSheet
        id="manage-app-disconnect-chooser"
        sheetRef={disconnectChooserRef}
        closeBottomSheet={closeDisconnectChooser}
        adjustToContentHeight
      >
        <Text weight="semiBold" fontSize={18} style={[spacings.mb, { textAlign: 'center' }]}>
          {t('Disconnect from')}
        </Text>
        <Text
          fontSize={14}
          appearance="secondaryText"
          style={[spacings.mbSm, { textAlign: 'center' }]}
        >
          {t('This app is connected through more than one channel. Choose which to disconnect.')}
        </Text>
        <Button
          type="secondary"
          text={t('Disconnect In-app browser')}
          onPress={() => handleDisconnect('injected')}
          hasBottomSpacing={false}
          style={spacings.mtTy}
        />
        <Button
          type="secondary"
          text={t('Disconnect WalletConnect')}
          onPress={() => handleDisconnect('wc')}
          hasBottomSpacing={false}
          style={spacings.mtTy}
        />
        <Button
          type="danger"
          text={t('Disconnect both')}
          onPress={() => handleDisconnect()}
          hasBottomSpacing={false}
          style={spacings.mtTy}
        />
      </BottomSheet>

      {isWeb && (
        <AccountPreferencesBottomSheet
          dapp={dapp}
          sheetRef={accountPreferencesRef}
          closeBottomSheet={closeAccountPreferences}
        />
      )}
    </>
  )
}

export default React.memo(ManageApp)
