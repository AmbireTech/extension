import React, { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'
import { useSearchParams } from 'react-router-dom'

import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Search from '@common/components/Search'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation/useNavigation.web'
import useToast from '@common/hooks/useToast'
import { HeaderWithTitle } from '@common/modules/header/components/Header/Header'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import LayoutWrapper from '@web/components/LayoutWrapper'
import { createTab } from '@web/extension-services/background/webapi/tab'
import Networks from '@web/modules/networks/components/Networks'

import AddNetworkBottomSheet from '../components/AddNetworkBottomSheet'
import AllNetworksOption from '../components/AllNetworksOption/AllNetworksOption'
import NetworkBottomSheet, {
  NO_BLOCK_EXPLORER_AVAILABLE_TOOLTIP
} from '../components/NetworkBottomSheet'

const NetworksScreen = () => {
  const { t } = useTranslation()
  const { addToast } = useToast()

  const { navigate } = useNavigation()
  const {
    state: { account, dashboardNetworkFilter },
    dispatch: selectedAccountDispatch
  } = useController('SelectedAccountController')
  const [settingsChainId, setSettingsChainId] = useState<bigint | string | null>(null)
  const [searchParams] = useSearchParams()
  const [changedNetwork, setChangedNetwork] = useState<undefined | null | bigint | string>(
    undefined
  )

  const {
    ref: settingsBottomSheetRef,
    open: openSettingsBottomSheet,
    close: closeSettingsBottomSheet
  } = useModalize()
  const {
    ref: addNetworkBottomSheetRef,
    open: openAddNetworkBottomSheet,
    close: closeAddNetworkBottomSheet
  } = useModalize()
  const { control, watch } = useForm({ mode: 'all', defaultValues: { search: '' } })
  const search = watch('search')

  // Navigate back to the dashboard only if `dashboardNetworkFilter` is already set in SelectedAccountControllerState.
  // Otherwise, a race condition occurs, and we navigate to the dashboard faster than `dashboardNetworkFilter` is set,
  // causing the dashboard to display data for the previous `dashboardNetworkFilter` for a brief moment.
  useEffect(() => {
    if (changedNetwork === dashboardNetworkFilter) {
      const prevSearchParams = searchParams.get('prevSearchParams')
      const url = prevSearchParams
        ? `${WEB_ROUTES.dashboard}?${decodeURIComponent(prevSearchParams)}`
        : WEB_ROUTES.dashboard

      navigate(url)
    }
  }, [changedNetwork, dashboardNetworkFilter, searchParams, navigate])

  const handleChangeNetwork = useCallback(
    (chainId: bigint | string | null) => {
      selectedAccountDispatch({
        type: 'method',
        params: { method: 'setDashboardNetworkFilter', args: [chainId] }
      })
      setChangedNetwork(chainId)
    },
    [selectedAccountDispatch, setChangedNetwork]
  )

  const handleOpenSettingsBottomSheet = useCallback(
    (chainId: bigint | string) => {
      setSettingsChainId(chainId)
      openSettingsBottomSheet()
    },
    [openSettingsBottomSheet]
  )

  const handleCloseSettingsBottomSheet = useCallback(() => {
    setSettingsChainId(null)
    closeSettingsBottomSheet()
  }, [closeSettingsBottomSheet])

  const handleOpenAddNetworkBottomSheet = useCallback(() => {
    openAddNetworkBottomSheet()
  }, [openAddNetworkBottomSheet])

  const openBlockExplorer = useCallback(
    async (url?: string) => {
      if (!url) {
        addToast(NO_BLOCK_EXPLORER_AVAILABLE_TOOLTIP, {
          type: 'info'
        })
        return
      }

      try {
        await createTab(`${url}/address/${account?.addr}`)
      } catch {
        addToast(t('Failed to open block explorer in a new tab.'), {
          type: 'info'
        })
      }
    },
    [account?.addr, addToast, t]
  )

  return (
    <LayoutWrapper>
      <HeaderWithTitle displayBackButtonIn="always" />
      <View style={[flexbox.flex1, spacings.pv, spacings.phSm]}>
        <Search control={control} autoFocus containerStyle={spacings.mbSm} />
        <NetworkBottomSheet
          chainId={settingsChainId}
          sheetRef={settingsBottomSheetRef}
          closeBottomSheet={handleCloseSettingsBottomSheet}
          openBlockExplorer={openBlockExplorer}
        />
        <AddNetworkBottomSheet
          sheetRef={addNetworkBottomSheetRef}
          closeBottomSheet={closeAddNetworkBottomSheet}
        />
        <ScrollableWrapper style={{ paddingBottom: 72 }}>
          <AllNetworksOption onPress={handleChangeNetwork} />
          <Networks
            search={search}
            openBlockExplorer={openBlockExplorer}
            openSettingsBottomSheet={handleOpenSettingsBottomSheet}
            onPress={handleChangeNetwork}
          />
        </ScrollableWrapper>
        <FooterGlassView size="sm">
          <Button
            text={t('Add new network')}
            size="smaller"
            hasBottomSpacing={false}
            style={{ minWidth: 174 }}
            childrenPosition="left"
            onPress={handleOpenAddNetworkBottomSheet}
          >
            <AddCircularIcon width={24} height={24} color="#fff" style={spacings.mrMi} />
          </Button>
        </FooterGlassView>
      </View>
    </LayoutWrapper>
  )
}

export default React.memo(NetworksScreen)
