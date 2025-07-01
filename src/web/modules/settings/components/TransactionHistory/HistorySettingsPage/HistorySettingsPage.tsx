import React, {
  ComponentType,
  FC,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import { View } from 'react-native'
import { useSearchParams } from 'react-router-dom'

import { Account } from '@ambire-common/interfaces/account'
import { Network } from '@ambire-common/interfaces/network'
import NetworksIcon from '@common/assets/svg/NetworksIcon'
import NetworkIcon from '@common/components/NetworkIcon'
import AccountOption from '@common/components/Option/AccountOption'
import Pagination from '@common/components/Pagination'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Select from '@common/components/Select'
import { SelectValue } from '@common/components/Select/types'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import useAccountsControllerState from '@web/hooks/useAccountsControllerState'
import useActivityControllerState from '@web/hooks/useActivityControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import SettingsPageHeader from '@web/modules/settings/components/SettingsPageHeader'
import { SettingsRoutesContext } from '@web/modules/settings/contexts/SettingsRoutesContext'

const ITEMS_PER_PAGE = 10

interface Props {
  HistoryComponent: ComponentType<{
    page?: number
    network?: Network
    account: Account
    sessionId: string
  }>
  historyType: 'transactions' | 'messages'
  sessionId: string
}

const ALL_NETWORKS_OPTION = {
  value: 'all',
  label: <Text weight="medium">All Networks</Text>,
  icon: (
    <View style={spacings.phMi}>
      <NetworksIcon width={24} height={24} />
    </View>
  )
}

const HistorySettingsPage: FC<Props> = ({ HistoryComponent, historyType, sessionId }) => {
  const { networks } = useNetworksControllerState()
  const activityState = useActivityControllerState()
  const { accounts } = useAccountsControllerState()
  const { account: accountData } = useSelectedAccountControllerState()
  const { dispatch } = useBackgroundService()
  const [page, setPage] = useState(1)
  const { t } = useTranslation()
  const { maxWidthSize } = useWindowSize()
  const { setCurrentSettingsPage } = useContext(SettingsRoutesContext)
  const [, setSearchParams] = useSearchParams()
  const { theme, themeType } = useTheme()

  useEffect(() => {
    setCurrentSettingsPage(historyType)
  }, [setCurrentSettingsPage, historyType])

  const itemsTotal =
    (historyType === 'messages'
      ? activityState.signedMessages?.[sessionId]?.result.itemsTotal
      : activityState.accountsOps?.[sessionId]?.result.itemsTotal) || 0

  const [account, setAccount] = useState<Account>(
    accounts.filter((acc) => acc.addr === accountData?.addr)[0]
  )
  const [network, setNetwork] = useState<Network | null>(null)

  const accountsOptions: SelectValue[] = useMemo(() => {
    return accounts.map((acc) => ({
      value: acc.addr,
      label: <AccountOption acc={acc} />,
      extraSearchProps: { accountLabel: acc.preferences.label }
    }))
  }, [accounts])

  const networksOptions: SelectValue[] = useMemo(
    () => [
      ALL_NETWORKS_OPTION,
      ...networks.map((n) => ({
        value: n.name,
        label: <Text weight="medium">{n.name}</Text>,
        icon: <NetworkIcon key={n.chainId.toString()} id={n.chainId.toString()} />
      }))
    ],
    [networks]
  )

  const isLoading = useMemo(() => {
    if (historyType === 'messages') {
      return account.addr !== activityState.signedMessages[sessionId]?.filters.account
    }

    // Loading check for history type = 'transactions'
    return (
      account.addr !== activityState.accountsOps[sessionId]?.filters.account ||
      network?.chainId !== activityState.accountsOps[sessionId]?.filters.chainId
    )
  }, [
    account.addr,
    activityState.signedMessages,
    activityState.accountsOps,
    sessionId,
    historyType,
    network?.chainId
  ])

  useEffect(() => {
    if (!account?.addr) return

    dispatch({
      type:
        historyType === 'transactions'
          ? 'MAIN_CONTROLLER_ACTIVITY_SET_ACC_OPS_FILTERS'
          : 'MAIN_CONTROLLER_ACTIVITY_SET_SIGNED_MESSAGES_FILTERS',
      params: {
        sessionId,
        filters: {
          account: account.addr,
          chainId: network?.chainId
        },
        pagination: {
          itemsPerPage: ITEMS_PER_PAGE,
          fromPage: page - 1
        }
      }
    })
  }, [dispatch, account.addr, network, page, sessionId, historyType])

  useEffect(() => {
    // Initialize the port session. This is necessary to automatically terminate the session when the tab is closed.
    // The process is managed in the background using port.onDisconnect,
    // as there is no reliable window event triggered when a tab is closed.
    setSearchParams((prev) => {
      prev.set('sessionId', sessionId)
      return prev
    })

    // Remove session - this will be triggered only when navigation to another screen internally in the extension.
    // The session removal when the window is forcefully closed is handled
    // in the port.onDisconnect callback in the background.
    const killSession = () => {
      dispatch({
        type:
          historyType === 'transactions'
            ? 'MAIN_CONTROLLER_ACTIVITY_RESET_ACC_OPS_FILTERS'
            : 'MAIN_CONTROLLER_ACTIVITY_RESET_SIGNED_MESSAGES_FILTERS',
        params: { sessionId }
      })
    }

    return () => {
      killSession()
    }
    // setSearchParams must not be in the dependency array
    // as it changes on call and kills the session prematurely
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyType, sessionId, dispatch])

  // Reset network filter state when a network is removed
  useEffect(() => {
    if (network?.chainId && !networks.find((n) => n.chainId === network?.chainId)) {
      setNetwork(null)
    }
  }, [network?.chainId, networks])

  const handleSetAccountValue = useCallback(
    (accountOption: SelectValue) => {
      setPage(1)
      setAccount(accounts.filter((acc) => acc.addr === accountOption.value)[0])
    },
    [accounts]
  )

  const handleSetNetworkValue = useCallback(
    (networkOption: SelectValue) => {
      setPage(1)
      if (networkOption.value === 'all') {
        setNetwork(null)
        return
      }
      setNetwork(networks.filter((n) => n.name === networkOption.value)[0])
    },
    [networks]
  )

  const goToNextPageDisabled = useMemo(() => {
    return ITEMS_PER_PAGE * page - itemsTotal >= 0
  }, [itemsTotal, page])

  return (
    <>
      <SettingsPageHeader
        title={historyType === 'messages' ? 'Signed messages' : 'Transaction history'}
      />
      <View style={[flexbox.directionRow, spacings.mbLg]}>
        <Select
          setValue={handleSetAccountValue}
          containerStyle={{ width: maxWidthSize('xl') ? 420 : 340, ...spacings.mr }}
          options={accountsOptions}
          value={accountsOptions.filter((opt) => opt.value === account.addr)[0]}
          selectStyle={
            themeType === THEME_TYPES.DARK ? { backgroundColor: theme.tertiaryBackground } : {}
          }
        />
        {historyType !== 'messages' && (
          <Select
            setValue={handleSetNetworkValue}
            containerStyle={{ width: 260 }}
            options={networksOptions}
            value={
              networksOptions.filter((opt) => opt.value === network?.name)[0] ?? ALL_NETWORKS_OPTION
            }
            selectStyle={
              themeType === THEME_TYPES.DARK ? { backgroundColor: theme.tertiaryBackground } : {}
            }
          />
        )}
      </View>
      {!isLoading ? (
        <>
          {historyType === 'messages' &&
            !!activityState?.signedMessages?.[sessionId]?.result.items?.length && (
              <View style={[flexbox.directionRow, spacings.phSm, spacings.mbTy]}>
                <View style={flexbox.flex1}>
                  <Text fontSize={14}>{t('Apps')}</Text>
                </View>
                <View style={flexbox.flex1}>
                  <Text fontSize={14}>{t('Submitted on')}</Text>
                </View>
                <View style={flexbox.flex1}>
                  <Text fontSize={14}>{t('Sign type')}</Text>
                </View>
                <View style={{ width: 15, height: 1 }} />
              </View>
            )}
          <ScrollableWrapper
            style={[spacings.mbXl, flexbox.flex1]}
            {...(historyType === 'messages' &&
            !!activityState.signedMessages?.[sessionId]?.result.items.length
              ? { stickyHeaderIndices: [0] }
              : {})}
          >
            <HistoryComponent
              page={page}
              account={account}
              network={network ?? undefined}
              sessionId={sessionId}
            />
          </ScrollableWrapper>
        </>
      ) : (
        <View style={[flexbox.flex1, flexbox.center]}>
          <Spinner />
        </View>
      )}
      <Pagination
        maxPages={Math.ceil(itemsTotal / ITEMS_PER_PAGE)}
        isNextDisabled={goToNextPageDisabled}
        style={{ marginLeft: 'auto' }}
        page={page}
        setPage={(p) => setPage(p)}
      />
    </>
  )
}

export default React.memo(HistorySettingsPage)
