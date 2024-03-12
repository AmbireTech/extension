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

import { Account } from '@ambire-common/interfaces/account'
import { NetworkDescriptor } from '@ambire-common/interfaces/networkDescriptor'
import { Avatar } from '@common/components/Avatar'
import NetworkIcon from '@common/components/NetworkIcon'
import { NetworkIconNameType } from '@common/components/NetworkIcon/NetworkIcon'
import Pagination from '@common/components/Pagination'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Select from '@common/components/Select'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useActivityControllerState from '@web/hooks/useActivityControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useMainControllerState from '@web/hooks/useMainControllerState'
import useSettingsControllerState from '@web/hooks/useSettingsControllerState'
import SettingsPageHeader from '@web/modules/settings/components/SettingsPageHeader'
import { SettingsRoutesContext } from '@web/modules/settings/contexts/SettingsRoutesContext'
import shortenAddress from '@web/utils/shortenAddress'

type AccountOption = {
  value: string
  label: JSX.Element
  icon: JSX.Element
}

type NetworkOption = {
  value: string
  label: JSX.Element
  icon: JSX.Element
}

const ITEMS_PER_PAGE = 10

const formatAddressLabelInSelector = (label: string, isLargeScreen: boolean) => {
  if (label.length > (isLargeScreen ? 26 : 18))
    return `${label.slice(0, isLargeScreen ? 24 : 16)}...`

  return label
}

interface Props {
  HistoryComponent: ComponentType<{
    page?: number
    network?: NetworkDescriptor
    account: Account
  }>
  historyType: 'transactions' | 'messages'
}

const HistorySettingsPage: FC<Props> = ({ HistoryComponent, historyType }) => {
  const { networks, accountPreferences } = useSettingsControllerState()
  const activityState = useActivityControllerState()
  const mainState = useMainControllerState()
  const { dispatch } = useBackgroundService()
  const [page, setPage] = useState(1)
  const { t } = useTranslation()
  const { maxWidthSize } = useWindowSize()
  const { setCurrentSettingsPage } = useContext(SettingsRoutesContext)

  useEffect(() => {
    setCurrentSettingsPage(historyType)
  }, [setCurrentSettingsPage, historyType])

  const itemsTotal =
    (historyType === 'messages'
      ? activityState.signedMessages?.itemsTotal
      : activityState.accountsOps?.itemsTotal) || 0

  const [account, setAccount] = useState<Account>(
    mainState.accounts.filter((acc) => acc.addr === mainState.selectedAccount)[0]
  )
  const [network, setNetwork] = useState<NetworkDescriptor>(
    networks.filter((n) => n.id === 'ethereum')[0]
  )

  const accountsOptions: AccountOption[] = useMemo(() => {
    return mainState.accounts.map((acc) => ({
      value: acc.addr,
      label: (
        <Text weight="medium" numberOfLines={1}>
          {`${formatAddressLabelInSelector(
            accountPreferences?.[acc.addr]?.label || '',
            maxWidthSize('xl')
          )} (${shortenAddress(acc.addr, 10)})`}
        </Text>
      ),
      icon: <Avatar pfp={accountPreferences[acc.addr]?.pfp} size={30} style={spacings.pr0} />
    }))
  }, [accountPreferences, mainState.accounts, maxWidthSize])

  const networksOptions: NetworkOption[] = useMemo(
    () =>
      networks.map((n) => ({
        value: n.id,
        label: <Text weight="medium">{n.name}</Text>,
        icon: <NetworkIcon name={n.id as NetworkIconNameType} />
      })),
    [networks]
  )

  useEffect(() => {
    if (!account || !activityState.isInitialized) return

    dispatch({
      type: 'MAIN_CONTROLLER_ACTIVITY_SET_FILTERS',
      params: {
        filters: {
          account: account.addr,
          network: network.id
        }
      }
    })
  }, [dispatch, account, network, activityState.isInitialized])

  useEffect(() => {
    if (activityState.isInitialized || !account) return

    dispatch({
      type: 'MAIN_CONTROLLER_ACTIVITY_INIT',
      params: {
        filters: {
          account: account.addr,
          network: network.id
        }
      }
    })
  }, [dispatch, account, network, activityState.isInitialized])

  useEffect(() => {
    if (!activityState.isInitialized) return

    dispatch({
      type:
        historyType === 'transactions'
          ? 'MAIN_CONTROLLER_ACTIVITY_SET_ACCOUNT_OPS_PAGINATION'
          : 'MAIN_CONTROLLER_ACTIVITY_SET_SIGNED_MESSAGES_PAGINATION',
      params: {
        pagination: {
          itemsPerPage: ITEMS_PER_PAGE,
          fromPage: page - 1
        }
      }
    })
  }, [page, historyType, activityState.isInitialized, dispatch])

  const handleSetAccountValue = useCallback(
    (accountOption: AccountOption) => {
      setPage(1)
      setAccount(mainState.accounts.filter((acc) => acc.addr === accountOption.value)[0])
    },
    [mainState.accounts]
  )

  const handleSetNetworkValue = useCallback(
    (networkOption: NetworkOption) => {
      setNetwork(networks.filter((net) => net.id === networkOption.value)[0])
    },
    [networks]
  )

  const goToNextPageDisabled = useMemo(() => {
    return ITEMS_PER_PAGE * page - itemsTotal >= 0
  }, [itemsTotal, page])

  return (
    <>
      <SettingsPageHeader
        title={historyType === 'messages' ? 'Signed Messages' : 'Transaction History'}
      />
      <View style={[flexbox.directionRow, spacings.mbLg]}>
        <Select
          setValue={handleSetAccountValue}
          style={{ width: maxWidthSize('xl') ? 420 : 340, ...spacings.mr }}
          options={accountsOptions}
          value={accountsOptions.filter((opt) => opt.value === account.addr)[0]}
        />
        {historyType !== 'messages' && (
          <Select
            setValue={handleSetNetworkValue}
            style={{ width: 260 }}
            options={networksOptions}
            value={networksOptions.filter((opt) => opt.value === network.id)[0]}
          />
        )}
      </View>
      <View style={[spacings.mbTy]}>
        {historyType === 'messages' && !!activityState?.signedMessages?.items?.length && (
          <View style={[flexbox.directionRow, flexbox.flex1, spacings.phSm]}>
            <View style={flexbox.flex1}>
              <Text fontSize={14}>{t('Dapps')}</Text>
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
      </View>
      <ScrollableWrapper
        style={[spacings.mbXl, flexbox.flex1]}
        {...(historyType === 'messages' && !!activityState.signedMessages?.items.length
          ? { stickyHeaderIndices: [0] }
          : {})}
      >
        {activityState.isInitialized ? (
          <HistoryComponent page={page} account={account} network={network} />
        ) : (
          <View style={[flexbox.flex1, flexbox.center]}>
            <Spinner />
          </View>
        )}
      </ScrollableWrapper>
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

export default HistorySettingsPage
