import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { IHandles } from 'react-native-modalize/lib/options'

import { Dapp } from '@ambire-common/interfaces/dapp'
import { NetworkDescriptor } from '@ambire-common/interfaces/networkDescriptor'
import DeleteIcon from '@common/assets/svg/DeleteIcon'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import NetworkIcon from '@common/components/NetworkIcon'
import Select from '@common/components/Select'
import Text from '@common/components/Text'
import predefinedDapps from '@common/constants/dappCatalog.json'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useDappsControllerState from '@web/hooks/useDappsControllerState'
import useSettingsControllerState from '@web/hooks/useSettingsControllerState'
import DappControl from '@web/modules/dapp-catalog/components/DappControl'

import getStyles from './styles'

type Props = {
  dapp: Dapp | null
  isCurrentDapp?: boolean
  sheetRef: React.RefObject<IHandles>
  openBottomSheet: (dest?: 'top' | 'default' | undefined) => void
  closeBottomSheet: (dest?: 'default' | 'alwaysOpen' | undefined) => void
}

type NetworkOption = {
  value: string
  label: JSX.Element
  icon: JSX.Element
}

const ManageDapp = ({
  dapp,
  isCurrentDapp,
  sheetRef,
  openBottomSheet,
  closeBottomSheet
}: Props) => {
  const { styles, theme } = useTheme(getStyles)
  const { t } = useTranslation()
  const { networks } = useSettingsControllerState()
  const { state } = useDappsControllerState()

  const [network, setNetwork] = useState<NetworkDescriptor>(
    networks.filter((n) => Number(n.chainId) === dapp?.chainId)[0] ||
      networks.filter((n) => n.id === 'ethereum')[0]
  )
  const { dispatch } = useBackgroundService()

  const networksOptions: NetworkOption[] = useMemo(
    () =>
      networks.map((n) => ({
        value: n.id,
        label: (
          <Text weight="medium" numberOfLines={1}>
            {n.name}
          </Text>
        ),
        icon: <NetworkIcon id={n.id} size={30} />
      })),
    [networks]
  )

  const handleSetNetworkValue = useCallback(
    (networkOption: NetworkOption) => {
      if (dapp?.url) {
        const newNetwork = networks.filter((net) => net.id === networkOption.value)[0]
        setNetwork(newNetwork)
        dispatch({
          type: 'CHANGE_CURRENT_DAPP_NETWORK',
          params: {
            origin: dapp.url,
            chainId: Number(newNetwork.chainId)
          }
        })
      }
    },
    [networks, dapp?.url, dispatch]
  )

  const shouldShowRemoveDappFromCatalog = useMemo(() => {
    return (
      !!state.dapps?.find((d) => d.url === dapp?.url) &&
      !predefinedDapps.find((d) => d.url === dapp?.url)
    )
  }, [dapp?.url, state.dapps])

  const removeDappFromCatalog = () => {
    // eslint-disable-next-line no-alert
    const isSure = window.confirm(
      dapp?.isConnected
        ? t(
            `Are you sure you want to remove ${dapp?.name} from your Dapp Catalog. This action will also disconnect the dApp from Ambire Wallet.`
          )
        : t(`Are you sure you want to remove ${dapp?.name} from your Dapp Catalog.`)
    )

    if (!isSure) return

    dispatch({
      type: 'DAPP_CONTROLLER_REMOVE_DAPP',
      params: dapp?.url!
    })
  }

  return (
    <BottomSheet id="dapp-footer" sheetRef={sheetRef} closeBottomSheet={closeBottomSheet}>
      <View style={[spacings.mbLg, spacings.ptSm]}>
        <DappControl
          dapp={dapp}
          inModal
          isCurrentDapp={isCurrentDapp}
          openBottomSheet={openBottomSheet}
          closeBottomSheet={closeBottomSheet}
        />
      </View>
      <View
        style={[
          styles.networkSelectorContainer,
          shouldShowRemoveDappFromCatalog ? spacings.mb3Xl : spacings.mb0
        ]}
      >
        <Text fontSize={14} style={flexbox.flex1}>
          {t('Select dApp Network')}
        </Text>
        <Select
          setValue={handleSetNetworkValue}
          menuOptionHeight={48}
          containerStyle={{ width: 230 }}
          selectStyle={{ height: 40 }}
          options={networksOptions}
          value={networksOptions.filter((opt) => opt.value === network.id)[0]}
        />
      </View>
      {!!shouldShowRemoveDappFromCatalog && (
        <View style={flexbox.alignCenter}>
          <Button
            size="small"
            type="ghost"
            textUnderline
            textStyle={{ color: theme.errorDecorative }}
            text={t('Remove from dApp Catalog')}
            hasBottomSpacing={false}
            onPress={removeDappFromCatalog}
          >
            <DeleteIcon
              color={theme.errorDecorative}
              width={16}
              style={spacings.mlTy}
              strokeWidth="1.8"
            />
          </Button>
        </View>
      )}
    </BottomSheet>
  )
}

export default React.memo(ManageDapp)
