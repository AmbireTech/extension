import React, { useCallback, useMemo, useState } from 'react'
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
import DisguiseAsMetaMask from '@common/modules/explore/components/ManageApp/DisguiseAsMetaMask'
import useDappConnectedAccount from '@common/modules/explore/hooks/useDappConnectedAccount'
import useManageApp from '@common/modules/explore/hooks/useManageApp'
import AccountSelect from '@common/modules/header/components/AccountSelect'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import common, { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { sortNetworksByBalance } from '@common/utils/sorting'

// The same footprint the sheet's other row action ("Manage") has, with a floor on the width so
// flipping between "Trust" and "Untrust" cannot shift the row. Both labels sit well below it.
const TRUST_BUTTON_STYLE: ViewStyle = { ...spacings.mlSm, height: 50, minWidth: 90 }

interface ManageAppProps {
  dapp: Dapp
  children: React.ReactNode
  isParentHovered?: boolean
  buttonProps?: Omit<React.ComponentProps<typeof Pressable>, 'onPress' | 'ref'>
  style?: ViewStyle
  onClosed?: () => void
  onReloadDapp?: () => void
}

const ManageApp = ({
  dapp,
  children,
  buttonProps,
  style = {},
  onClosed,
  onReloadDapp
}: ManageAppProps) => {
  const { theme } = useTheme()
  const { networks, onDisconnect, onSelectNetwork, onToggleTrust } = useManageApp(dapp)
  const { ref: sheetRef, open, close } = useModalize()
  const {
    ref: disconnectChooserRef,
    open: openDisconnectChooser,
    close: closeDisconnectChooser
  } = useModalize()
  const [isManageAccountsOpen, setIsManageAccountsOpen] = useState(false)
  // Every app in Explore has its own ManageApp, so the account sheet mounts only once this one
  // opens - before its Manage button can be pressed, so the sheet is ready to open by then
  const [hasOpened, setHasOpened] = useState(false)
  const { t } = useTranslation()
  const { state: balancePerNetwork } = useController(
    'SelectedAccountController',
    (state) => state.portfolio.balancePerNetwork
  )

  const connectedSources = dapp.connectedSources ?? []
  const hasMultipleSources = connectedSources.length > 1

  const handleOpen = useCallback(() => {
    setHasOpened(true)
    open()
  }, [open])

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
      sortNetworksByBalance(networks, balancePerNetwork).map((n) => ({
        value: n.chainId.toString(),
        extraSearchProps: { name: n.name },
        label: (
          <Text weight="medium" fontSize={14} numberOfLines={1}>
            {n.name}
          </Text>
        ),
        icon: <NetworkIcon size={24} id={n.chainId.toString()} />
      })),
    [networks, balancePerNetwork]
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

  // The dapp can be scoped to a subset of accounts, so it may not see the selected one
  const connectedAccount = useDappConnectedAccount(dapp)

  return (
    <>
      <AnimatedPressable
        onPress={handleOpen}
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

        {!!connectedAccount && (
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
                onPress={() => setIsManageAccountsOpen(true)}
                hasBottomSpacing={false}
                style={{ ...spacings.mlSm, height: 50 }}
              />
            </View>
          </View>
        )}

        {dapp.blacklisted === 'SUSPICIOUS_HOSTING' && (
          <View style={spacings.mbSm}>
            <Text fontSize={14} appearance="secondaryText" style={spacings.mbMi}>
              {t('Suspicious app hosting')}
            </Text>
            <View style={[flexbox.directionRow, flexbox.alignCenter]}>
              <View
                style={[
                  flexbox.flex1,
                  common.borderRadiusPrimary,
                  spacings.ph,
                  spacings.pvTy,
                  { backgroundColor: theme.tertiaryBackground }
                ]}
              >
                <Text fontSize={14} appearance="secondaryText">
                  {t(
                    'Shared hosting, commonly used for phishing. Trust this app and we stop warning you.'
                  )}
                </Text>
              </View>
              {!!dapp.canBeTrustedByUser && (
                <Button
                  type={dapp.isTrustedByUser ? 'tertiary' : 'warning'}
                  text={dapp.isTrustedByUser ? t('Untrust') : t('Trust')}
                  onPress={onToggleTrust}
                  hasBottomSpacing={false}
                  testID="trust-dapp-button"
                  style={TRUST_BUTTON_STYLE}
                />
              )}
            </View>
          </View>
        )}

        {dapp.blacklisted !== 'BLACKLISTED' && !dapp.isConnected && (
          <View
            style={
              isWeb
                ? [
                    spacings.mtSm,
                    {
                      backgroundColor: theme.tertiaryBackground,
                      borderRadius: BORDER_RADIUS_PRIMARY
                    }
                  ]
                : undefined
            }
          >
            <DisguiseAsMetaMask
              dapp={dapp}
              onToggled={() => {
                close()
                onReloadDapp?.()
              }}
            />
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

      {hasOpened && (
        <AccountSelect
          dappToManage={dapp}
          isOpen={isManageAccountsOpen}
          setIsOpen={setIsManageAccountsOpen}
        />
      )}
    </>
  )
}

export default React.memo(ManageApp)
