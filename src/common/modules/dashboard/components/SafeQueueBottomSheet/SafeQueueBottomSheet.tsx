import React, { FC, useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { CallsUserRequest } from '@ambire-common/interfaces/userRequest'
import CloseIcon from '@common/assets/svg/CloseIcon'
import InfoIcon from '@common/assets/svg/InfoIcon'
import NetworksIcon from '@common/assets/svg/NetworksIcon'
import RefreshIcon from '@common/assets/svg/RefreshIcon'
import BottomSheet from '@common/components/BottomSheet'
import HoverablePressable from '@common/components/HoverablePressable'
import NetworkIcon from '@common/components/NetworkIcon'
import Select from '@common/components/Select'
import { SelectValue } from '@common/components/Select/types'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { getSafeQueueNetworkGroups, SafeQueueNetworkGroup, SafeQueueNonceGroup } from './helpers'
import SafeQueueItem from './SafeQueueItem'
import getStyles from './styles'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'
const selectRefreshSafeTxnsStatus = (state: AllControllersMappingType['MainController']) =>
  state.statuses?.refreshSafeTxns

interface Props {
  sheetRef: ReturnType<typeof useModalize>['ref']
  closeBottomSheet: () => void
  requests: CallsUserRequest[]
  currentNonces: Record<string, bigint | undefined>
  autoOpen?: boolean
}

interface NonceGroupProps {
  group: SafeQueueNonceGroup
  currentNonce: bigint
  index: number
  groupsCount: number
  closeBottomSheet: () => void
}

const NonceGroup: FC<NonceGroupProps> = ({
  group,
  currentNonce,
  index,
  groupsCount,
  closeBottomSheet
}) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const isCurrentNonce = group.nonce === currentNonce
  const hasSameNonceTransactions = group.requests.length > 1

  return (
    <View style={[flexbox.directionRow]}>
      <View style={styles.timelineRail}>
        {index > 0 && <View style={styles.timelineLineTop} />}
        {index < groupsCount - 1 && <View style={styles.timelineLineBottom} />}
        <View style={[styles.nonceMarker, isCurrentNonce && styles.nonceMarkerCurrent]}>
          <Text
            fontSize={14}
            weight="semiBold"
            style={[styles.nonceMarkerText, isCurrentNonce && styles.nonceMarkerTextCurrent]}
          >
            {group.nonce.toString()}
          </Text>
        </View>
        {isCurrentNonce && (
          <View style={[styles.nextBadge, spacings.phMi, spacings.pvMi, spacings.mtMi]}>
            <Text fontSize={9} weight="medium" color={theme.primaryAccent}>
              {t('Nonce')}
            </Text>
          </View>
        )}
      </View>

      <View style={[flexbox.flex1, spacings.pb]}>
        {hasSameNonceTransactions ? (
          <View style={[styles.sameNonceGroup, spacings.phSm, spacings.pvSm]}>
            <View style={styles.sameNonceBranch} />
            <Text fontSize={14} weight="semiBold">
              {t('{{count}} transactions · Same nonce', { count: group.requests.length })}
            </Text>
            <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mtMi, spacings.mbSm]}>
              <InfoIcon width={14} height={14} color={theme.warningText} />
              <Text fontSize={12} color={theme.warningText} style={spacings.mlMi}>
                {t('Only one can be executed')}
              </Text>
            </View>
            {group.requests.map((request, requestIndex) => (
              <View key={request.id}>
                {requestIndex > 0 && <View style={[styles.divider, spacings.mbSm]} />}
                <SafeQueueItem
                  request={request}
                  closeBottomSheet={closeBottomSheet}
                  withBorder={false}
                />
                {requestIndex < group.requests.length - 1 && <View style={spacings.mbSm} />}
              </View>
            ))}
          </View>
        ) : (
          <SafeQueueItem request={group.requests[0]!} closeBottomSheet={closeBottomSheet} />
        )}
        {group.nonce > currentNonce && (
          <Text fontSize={11} appearance="secondaryText" style={[spacings.mtMi, spacings.mlSm]}>
            {t('Runs after nonce {{nonce}}', { nonce: (group.nonce - 1n).toString() })}
          </Text>
        )}
      </View>
    </View>
  )
}

const MemoizedNonceGroup = React.memo(NonceGroup)

const NetworkGroup: FC<{
  group: SafeQueueNetworkGroup
  currentNonce: bigint
  closeBottomSheet: () => void
}> = ({ group, currentNonce, closeBottomSheet }) => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)

  return (
    <View style={[styles.networkSection, spacings.mb]}>
      <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbSm]}>
        <View style={[styles.networkHeaderIcon, flexbox.center]}>
          <NetworkIcon id={group.network.chainId.toString()} size={28} />
        </View>
        <View>
          <Text fontSize={18} weight="semiBold">
            {group.network.name}
          </Text>
          <Text fontSize={12} appearance="secondaryText">
            {t(group.requestsCount === 1 ? '1 transaction' : '{{count}} transactions', {
              count: group.requestsCount
            })}
          </Text>
        </View>
      </View>
      {group.nonceGroups.map((nonceGroup, index) => (
        <MemoizedNonceGroup
          key={nonceGroup.nonce.toString()}
          group={nonceGroup}
          currentNonce={currentNonce}
          index={index}
          groupsCount={group.nonceGroups.length}
          closeBottomSheet={closeBottomSheet}
        />
      ))}
    </View>
  )
}

const MemoizedNetworkGroup = React.memo(NetworkGroup)

const SafeQueueBottomSheet: FC<Props> = ({
  sheetRef,
  closeBottomSheet,
  requests,
  currentNonces,
  autoOpen = false
}) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const {
    state: { networks }
  } = useController('NetworksController')
  const {
    state: { account }
  } = useController('SelectedAccountController')
  const { state: refreshSafeTxnsStatus, dispatch: mainDispatch } = useController(
    'MainController',
    selectRefreshSafeTxnsStatus
  )
  const [selectedNetwork, setSelectedNetwork] = useState<string>('all')
  const isRefreshing = refreshSafeTxnsStatus === 'LOADING'
  const networkGroups = useMemo(
    () => getSafeQueueNetworkGroups(requests, networks),
    [networks, requests]
  )
  const effectiveSelectedNetwork =
    selectedNetwork === 'all' ||
    networkGroups.some((group) => group.network.chainId.toString() === selectedNetwork)
      ? selectedNetwork
      : 'all'
  const filteredNetworkGroups = useMemo(
    () =>
      effectiveSelectedNetwork === 'all'
        ? networkGroups
        : networkGroups.filter(
            (group) => group.network.chainId.toString() === effectiveSelectedNetwork
          ),
    [effectiveSelectedNetwork, networkGroups]
  )
  const networkOptions = useMemo<SelectValue[]>(
    () => [
      {
        value: 'all',
        label: <Text weight="medium">{t('All networks')}</Text>,
        icon: <NetworksIcon width={24} height={24} />
      },
      ...networkGroups.map(({ network }) => ({
        value: network.chainId.toString(),
        label: <Text weight="medium">{network.name}</Text>,
        icon: <NetworkIcon id={network.chainId.toString()} />
      }))
    ],
    [networkGroups, t]
  )
  const selectedNetworkOption =
    networkOptions.find((option) => option.value === effectiveSelectedNetwork) || networkOptions[0]
  const handleSelectNetwork = useCallback((option: SelectValue) => {
    setSelectedNetwork(String(option.value))
  }, [])
  const handleRefresh = useCallback(() => {
    mainDispatch({ type: 'method', params: { method: 'refreshSafeTxns', args: [] } })
  }, [mainDispatch])

  return (
    <BottomSheet
      id="safe-queue"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      onBackdropPress={closeBottomSheet}
      adjustToContentHeight={false}
      modalHeight={540}
      backgroundColor="primaryBackground"
      reserveScrollPadding
      autoOpen={autoOpen}
    >
      <View style={[flexbox.directionRow, flexbox.justifySpaceBetween, flexbox.alignStart]}>
        <Text fontSize={24} weight="semiBold">
          {t('Queue')}
        </Text>
        <HoverablePressable
          accessibilityLabel={t('Close Queue')}
          style={[styles.closeButton, flexbox.center]}
          onPress={closeBottomSheet}
        >
          <CloseIcon width={20} height={20} color={theme.iconPrimary} />
        </HoverablePressable>
      </View>
      <View
        style={[
          flexbox.directionRow,
          flexbox.justifySpaceBetween,
          flexbox.alignCenter,
          spacings.mtMi
        ]}
      >
        <Text fontSize={13} appearance="secondaryText">
          {account?.preferences.label}
        </Text>
        <HoverablePressable
          accessibilityRole="button"
          accessibilityLabel={t('Refresh Safe Queue')}
          accessibilityState={{ busy: isRefreshing, disabled: isRefreshing }}
          testID="safe-queue-refresh-button"
          disabled={isRefreshing}
          onPress={handleRefresh}
          style={[styles.refreshButton, flexbox.directionRow, flexbox.alignCenter, spacings.phMi]}
        >
          {isRefreshing ? (
            <Spinner style={{ width: 16, height: 16 }} />
          ) : (
            <RefreshIcon width={16} height={16} color={theme.primaryAccent} />
          )}
          <Text fontSize={13} color={theme.primaryAccent} style={spacings.mlMi}>
            {isRefreshing ? t('Refreshing...') : t('Refresh')}
          </Text>
        </HoverablePressable>
      </View>

      <Select
        testID="safe-queue-network-filter"
        options={networkOptions}
        value={selectedNetworkOption}
        setValue={handleSelectNetwork}
        size="md"
        containerStyle={spacings.mv}
        selectStyle={{ backgroundColor: theme.secondaryBackground }}
      />

      {filteredNetworkGroups.length ? (
        filteredNetworkGroups.map((group) => (
          <MemoizedNetworkGroup
            key={group.network.chainId.toString()}
            group={group}
            currentNonce={
              currentNonces[group.network.chainId.toString()] ?? group.nonceGroups[0]!.nonce
            }
            closeBottomSheet={closeBottomSheet}
          />
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text fontSize={16} weight="semiBold">
            {t('Your Safe Queue is empty')}
          </Text>
          <Text fontSize={12} appearance="secondaryText" style={spacings.mtTy}>
            {t('Transactions waiting for signatures or broadcast will appear here.')}
          </Text>
        </View>
      )}
      {isRefreshing && (
        <View style={[flexbox.directionRow, flexbox.justifyCenter, spacings.mtSm, spacings.pbSm]}>
          <Text fontSize={12} appearance="secondaryText">
            {t('Loading...')}
          </Text>
        </View>
      )}
    </BottomSheet>
  )
}

export default React.memo(SafeQueueBottomSheet)
