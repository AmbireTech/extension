import { toBundleTxn } from 'ambire-common/src/services/requestToBundleTxn'
import React, { useCallback, useContext } from 'react'
import isEqual from 'react-fast-compare'
import { RefreshControl, TouchableOpacity, View } from 'react-native'

import ConfirmedIcon from '@common/assets/svg/ConfirmedIcon'
import PendingIcon from '@common/assets/svg/PendingIcon'
import SignIcon from '@common/assets/svg/SignIcon'
import Button from '@common/components/Button'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import TxnPreview from '@common/components/TxnPreview'
import Wrapper, { WRAPPER_TYPES } from '@common/components/Wrapper'
import CONFIG, { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import { DetailedBundleContext } from '@common/modules/send/contexts/detailedBundleContext'
import BundleSimplePreview from '@common/modules/transactions/components/BundleSimplePreview'
import colors from '@common/styles/colors'
import spacings, { IS_SCREEN_SIZE_S } from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'

import styles from './styles'

const TransactionsSectionList = ({
  data,
  errMsg,
  isLoading,
  speedup,
  replace,
  cancel,
  firstPending,
  showSendTxns,
  forceRefresh,
  eligibleRequests,
  networkId,
  selectedAcc
}: any) => {
  const { t } = useTranslation()
  const { setMined, setOpenedBundle } = useContext(DetailedBundleContext)

  const handleSetOpenedBundle = useCallback((bundle: any) => setOpenedBundle(bundle), [])
  const handleSetMined = useCallback((isMined: boolean) => setMined(isMined), [])

  const renderPendingTxns = () => (
    <Panel contentContainerStyle={styles.panel} type="filled">
      {eligibleRequests.map((req) => (
        <TouchableOpacity onPress={() => showSendTxns(null)} activeOpacity={0.8} key={req.id}>
          <TxnPreview
            network={networkId}
            account={selectedAcc}
            disableExpand
            txn={toBundleTxn(req.txn, selectedAcc)}
          />
        </TouchableOpacity>
      ))}
      <View style={spacings.ptSm}>
        <Button onPress={() => showSendTxns(null)} text={t('Sign or Reject')} />
      </View>
    </Panel>
  )

  const renderPendingSentTxns = ({ item }: any) => (
    <BundleSimplePreview
      bundle={item}
      mined={false}
      setOpenedBundle={handleSetOpenedBundle}
      setMined={handleSetMined}
      actions={
        <View style={spacings.ptTy}>
          <Button
            onPress={() => replace(firstPending)}
            text={t('Replace or Modify')}
            style={[flexboxStyles.flex1, spacings.mrTy]}
          />
          <View style={flexboxStyles.directionRow}>
            <Button
              type="danger"
              onPress={() => cancel(firstPending)}
              text={t('Cancel')}
              containerStyle={flexboxStyles.flex1}
              style={[spacings.mrMi]}
            />
            <Button
              type="outline"
              onPress={() => speedup(firstPending)}
              text={t('Speed Up')}
              containerStyle={flexboxStyles.flex1}
              style={[spacings.mlMi]}
            />
          </View>
        </View>
      }
    />
  )

  const renderConfirmedTxns = ({ item }: any) => (
    <BundleSimplePreview
      bundle={item}
      mined
      setOpenedBundle={handleSetOpenedBundle}
      setMined={handleSetMined}
    />
  )

  const renderConfirmedTxnsEmptyState = () => {
    return (
      <Panel type="filled" contentContainerStyle={styles.panel}>
        {!CONFIG.RELAYER_URL && (
          <Text>{t('Unsupported: not currently connected to a relayer.')}</Text>
        )}
        {!!errMsg && (
          <Text>
            {t('Error getting list of transactions:')} {errMsg}
          </Text>
        )}
        {!!CONFIG.RELAYER_URL && !errMsg && (
          <Text style={textStyles.center} fontSize={16}>
            {t("You don't have any transactions on this account.")}
          </Text>
        )}
      </Panel>
    )
  }

  const SECTIONS_DATA = [
    {
      title: t('Waiting to be signed (current batch)'),
      titleIcon: (
        <View style={spacings.mrTy}>
          <SignIcon />
        </View>
      ),
      shouldRenderTitle: !!eligibleRequests.length,
      renderItem: renderPendingTxns,
      data: eligibleRequests.length ? ['render-only-one-item'] : []
    },
    {
      title: t('Pending transaction bundle'),
      titleIcon: (
        <View style={spacings.mrTy}>
          <PendingIcon />
        </View>
      ),
      shouldRenderTitle: !!firstPending,
      renderItem: renderPendingSentTxns,
      data: firstPending ? ['render-only-one-item'] : []
    },
    {
      title: data?.txns?.length ? t('Confirmed transactions') : t('No confirmed transactions yet'),
      titleIcon: (
        <View style={spacings.mrTy}>
          <ConfirmedIcon />
        </View>
      ),
      shouldRenderTitle: true,
      renderItem: data?.txns?.length ? renderConfirmedTxns : renderConfirmedTxnsEmptyState,
      data: data?.txns?.filter((x: any) => x.executed)?.length
        ? data?.txns?.filter((x: any) => x.executed)
        : ['render-only-one-item']
    }
  ]

  return (
    <Wrapper
      hasBottomTabNav
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={forceRefresh}
          tintColor={colors.titan}
          progressBackgroundColor={colors.titan}
          enabled={!isLoading}
        />
      }
      // The sticky title is with rounded top corners
      // and the same corner radius should be applied on the main scrollable container
      // otherwise when scrolling the content is visible beneath the sticky title
      style={spacings.ph0}
      contentContainerStyle={isWeb && spacings.ph0}
      // a horizontal margin is applied to the wrapper of the scrollable container instead of padding
      // because we need its border radius to overlap with the sticky title
      // thus the scroll indicator is rendered on top of the content and there is no way
      // to position it outside the scroll view
      // Leaving it hidden for now
      showsVerticalScrollIndicator={false}
      type={WRAPPER_TYPES.SECTION_LIST}
      sections={SECTIONS_DATA}
      keyExtractor={(item, index) => item + index}
      renderItem={({ section: { renderItem } }: any) => renderItem}
      stickySectionHeadersEnabled
      renderSectionHeader={({ section: { title, titleIcon, shouldRenderTitle } }) =>
        shouldRenderTitle ? (
          <View
            style={[
              styles.sectionTitleWrapper,
              flexboxStyles.directionRow,
              flexboxStyles.alignCenter
            ]}
          >
            {!!titleIcon && titleIcon}
            <Text fontSize={IS_SCREEN_SIZE_S ? 14 : 16} weight="medium">
              {title}
            </Text>
          </View>
        ) : null
      }
    />
  )
}

export default React.memo(TransactionsSectionList, isEqual)
