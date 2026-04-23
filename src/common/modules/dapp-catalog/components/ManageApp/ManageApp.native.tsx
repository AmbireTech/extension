import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View, ViewStyle } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { Dapp } from '@ambire-common/interfaces/dapp'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import NetworkIcon from '@common/components/NetworkIcon'
import AccountOption from '@common/components/Option/AccountOption'
import Select from '@common/components/Select'
import { SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import { AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import DappItem from '@common/modules/dapp-catalog/components/DappItem'
import useManageApp from '@common/modules/dapp-catalog/hooks/useManageApp'
import spacings from '@common/styles/spacings'

interface ManageAppProps {
  dapp: Dapp
  children: React.ReactNode
  withCurrentAccount?: boolean
  isParentHovered?: boolean
  buttonProps?: Omit<React.ComponentProps<typeof Pressable>, 'onPress' | 'ref'>
  style?: ViewStyle
}

const ManageApp = ({
  dapp,
  children,
  withCurrentAccount = false,
  isParentHovered: _isParentHovered,
  buttonProps,
  style = {}
}: ManageAppProps) => {
  const { theme } = useTheme()
  const { account, accounts, networks, onSelectNetwork } = useManageApp(dapp)
  const { ref: sheetRef, open, close } = useModalize()
  const { t } = useTranslation()
  const { dispatch } = useControllersMiddleware()

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

  return (
    <>
      <AnimatedPressable onPress={open} {...(buttonProps as any)}>
        {children}
      </AnimatedPressable>

      <BottomSheet
        id="manage-app"
        sheetRef={sheetRef}
        closeBottomSheet={close}
        adjustToContentHeight
        style={style}
      >
        <Text weight="semiBold" fontSize={18} style={[spacings.mb, { textAlign: 'center' }]}>
          {t('Current app')}
        </Text>

        <View style={spacings.mbSm}>
          <DappItem {...dapp} isInSettings onPressOverride={() => {}} />
        </View>

        <Select
          value={selectedNetwork}
          setValue={handleSetNetwork}
          options={networksOptions}
          label={t('Chain')}
          withSearch
          bottomSheetTitle={t('Chain')}
          selectStyle={{ backgroundColor: theme.tertiaryBackground }}
        />

        {!!withCurrentAccount && !!account && (
          <Select
            value={{
              value: account.addr,
              label: <AccountOption acc={account} />
            }}
            options={accountsOptions}
            disabled
            label={t('Account')}
            selectStyle={{ backgroundColor: theme.tertiaryBackground }}
          />
        )}

        {!!dapp.isConnected && (
          <Button
            type="danger"
            text={t('Disconnect')}
            onPress={() => {
              dispatch({
                type: 'DAPPS_CONTROLLER_DISCONNECT_DAPP',
                params: { id: dapp.id, url: dapp.url }
              })
              close()
            }}
            hasBottomSpacing={false}
            style={spacings.mtSm}
          />
        )}
      </BottomSheet>
    </>
  )
}

export default React.memo(ManageApp)
