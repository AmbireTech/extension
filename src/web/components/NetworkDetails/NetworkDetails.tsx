/* eslint-disable react/jsx-no-useless-fragment */
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View, ViewStyle } from 'react-native'
import { useModalize } from 'react-native-modalize'

import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import EditPenIcon from '@common/assets/svg/EditPenIcon'
import UpArrowIcon from '@common/assets/svg/UpArrowIcon'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import Dialog from '@common/components/Dialog'
import DialogButton from '@common/components/Dialog/DialogButton'
import DialogFooter from '@common/components/Dialog/DialogFooter'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import { isAmbireNext, isDev } from '@common/config/env'
import useController from '@common/hooks/useController'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings, { SPACING, SPACING_MD, SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import NetworkForm from '@web/modules/settings/screens/NetworksSettingsScreen/NetworkForm'

import getStyles from './styles'

type Props = {
  name: string
  iconUrls?: string[]
  batchMaxCount?: number | '-'
  selectedRpcUrl: string
  rpcUrls: string[]
  chainId: bigint | string
  explorerUrl: string
  nativeAssetSymbol: string
  nativeAssetName: string
  allowRemoveNetwork?: boolean
  style?: ViewStyle
  type?: 'vertical' | 'horizontal'
  responsiveSizeMultiplier?: number
}

const NetworkDetails = ({
  name,
  iconUrls = [],
  selectedRpcUrl,
  rpcUrls,
  chainId,
  batchMaxCount,
  explorerUrl,
  nativeAssetSymbol,
  nativeAssetName,
  allowRemoveNetwork,
  style,
  type = 'horizontal',
  responsiveSizeMultiplier = 1
}: Props) => {
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)

  const {
    state: { statuses, allNetworks },
    dispatch: networksDispatch
  } = useController('NetworksController')
  const { ref: dialogRef, open: openDialog, close: closeDialog } = useModalize()

  const { pathname } = useRoute()
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const [showAllRpcUrls, setShowAllRpcUrls] = useState(false)
  const isEmpty = useMemo(
    () => [name, rpcUrls[0], chainId].some((p) => p === '-'),
    [chainId, name, rpcUrls]
  )

  const networkData = useMemo(
    () => allNetworks.find((network) => network.chainId.toString() === chainId.toString()),
    [allNetworks, chainId]
  )

  const isEditableRoute = useMemo(
    () =>
      pathname?.includes(ROUTES.networksSettings) ||
      pathname?.includes(ROUTES.networksConfiguration),
    [pathname]
  )
  const allowDisableWithoutConfirmation = useMemo(
    () => pathname?.includes(ROUTES.networksConfiguration),
    [pathname]
  )

  const shouldDisplayEditButton = useMemo(() => isEditableRoute && !isEmpty, [pathname, isEmpty])

  const shouldDisplayDisableButton = useMemo(
    () => isEditableRoute && !isEmpty && allowRemoveNetwork && String(chainId) !== '1',
    [isEmpty, allowRemoveNetwork, chainId, isEditableRoute]
  )

  const updateNetworkDisabled = useCallback(() => {
    if (statuses.updateNetwork !== 'INITIAL') return
    networksDispatch({
      type: 'method',
      params: {
        method: 'updateNetwork',
        args: [{ disabled: !networkData?.disabled }, BigInt(chainId)]
      }
    })
    closeDialog()
  }, [chainId, closeDialog, networkData?.disabled, networksDispatch, statuses.updateNetwork])

  const toggleNetworkDisabled = useCallback(() => {
    if (networkData?.disabled || allowDisableWithoutConfirmation) {
      updateNetworkDisabled()
    } else {
      openDialog()
    }
  }, [networkData?.disabled, openDialog, updateNetworkDisabled, allowDisableWithoutConfirmation])

  const renderInfoItem = useCallback(
    (title: string, value: string, withBottomSpacing = true) => {
      return (
        <View
          style={[
            type === 'horizontal' && flexbox.directionRow,
            type === 'horizontal' && flexbox.alignCenter,
            !!withBottomSpacing && {
              marginBottom:
                type === 'vertical'
                  ? SPACING_SM * responsiveSizeMultiplier
                  : SPACING_MD * responsiveSizeMultiplier
            }
          ]}
        >
          <Text
            fontSize={14 * responsiveSizeMultiplier}
            appearance="tertiaryText"
            style={[
              type === 'horizontal'
                ? {
                    marginRight: SPACING * responsiveSizeMultiplier
                  }
                : {}
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <View
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              flexbox.flex1,
              type === 'horizontal' && flexbox.justifyEnd
            ]}
          >
            {title === 'Network Name' && value !== '-' && (
              <View style={spacings.mrMi}>
                <NetworkIcon
                  key={name.toLowerCase() as any}
                  id={chainId.toString()}
                  name={name}
                  uris={iconUrls.length ? iconUrls : undefined}
                  size={24 * responsiveSizeMultiplier}
                />
              </View>
            )}
            <Text
              fontSize={14 * responsiveSizeMultiplier}
              appearance={value === 'Invalid Chain ID' ? 'errorText' : 'secondaryText'}
              numberOfLines={1}
              weight="medium"
              selectable
            >
              {value}
            </Text>
          </View>
        </View>
      )
    },
    [type, responsiveSizeMultiplier, name, chainId, iconUrls]
  )

  const sortedRpcUrls = useMemo(
    () => [selectedRpcUrl, ...rpcUrls.filter((u) => u !== selectedRpcUrl)],
    [rpcUrls, selectedRpcUrl]
  )

  const showMoreRpcUrlsButton = useMemo(() => {
    return sortedRpcUrls.length > 1 ? (
      <Pressable
        style={[
          spacings.ptMi,
          flexbox.directionRow,
          flexbox.alignCenter,
          type === 'horizontal' && spacings.mbMi
        ]}
        onPress={() => setShowAllRpcUrls((p) => !p)}
      >
        <Text
          style={spacings.mrMi}
          fontSize={12 * responsiveSizeMultiplier}
          color={theme.linkText}
          underline
        >
          {!showAllRpcUrls &&
            t('show {{number}} more', {
              number: sortedRpcUrls.length - 1
            })}
          {!!showAllRpcUrls &&
            t('hide {{number}} urls', {
              number: sortedRpcUrls.length - 1
            })}
        </Text>
        {!!showAllRpcUrls && (
          <UpArrowIcon width={12} height={6} color={theme.linkText} strokeWidth="1.7" />
        )}
        {!showAllRpcUrls && (
          <DownArrowIcon width={12} height={6} color={theme.linkText} strokeWidth="1.7" />
        )}
      </Pressable>
    ) : null
  }, [sortedRpcUrls.length, type, responsiveSizeMultiplier, theme.linkText, showAllRpcUrls, t])

  const renderRpcUrlsItem = useCallback(() => {
    return (
      <View
        style={[
          type === 'horizontal' && flexbox.directionRow,
          {
            marginBottom: (type === 'vertical' ? SPACING_SM : SPACING_MD) * responsiveSizeMultiplier
          }
        ]}
      >
        <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifySpaceBetween]}>
          <Text
            fontSize={(type === 'horizontal' ? 14 : 16) * responsiveSizeMultiplier}
            appearance="tertiaryText"
            style={{
              marginRight: SPACING * responsiveSizeMultiplier
            }}
            numberOfLines={1}
          >
            {t(`RPC URL${sortedRpcUrls.length ? '(s)' : ''}`)}
          </Text>
          {type === 'vertical' && showMoreRpcUrlsButton}
        </View>
        <View style={[flexbox.flex1, type === 'horizontal' && flexbox.alignEnd]}>
          {!showAllRpcUrls ? (
            <Text
              fontSize={14 * responsiveSizeMultiplier}
              appearance="secondaryText"
              numberOfLines={1}
              weight="medium"
              selectable
            >
              {sortedRpcUrls[0]}
            </Text>
          ) : (
            sortedRpcUrls.map((rpcUrl: string, i) => (
              <Text
                key={rpcUrl}
                fontSize={14 * responsiveSizeMultiplier}
                appearance={i === 0 ? 'secondaryText' : 'tertiaryText'}
                weight={i === 0 ? 'medium' : 'regular'}
                numberOfLines={1}
                style={i !== sortedRpcUrls.length - 1 && spacings.mbMi}
                selectable
              >
                {rpcUrl}
              </Text>
            ))
          )}
          {type === 'horizontal' && showMoreRpcUrlsButton}
        </View>
      </View>
    )
  }, [type, responsiveSizeMultiplier, t, sortedRpcUrls, showMoreRpcUrlsButton, showAllRpcUrls])

  return (
    <>
      <View
        style={[
          styles.container,
          {
            paddingHorizontal: SPACING_MD * responsiveSizeMultiplier,
            paddingVertical: SPACING_MD * responsiveSizeMultiplier
          },
          shouldDisplayEditButton ? { paddingTop: SPACING_SM * responsiveSizeMultiplier } : {},
          style
        ]}
      >
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            {
              marginBottom:
                (type === 'vertical' ? SPACING_SM : SPACING_MD) * responsiveSizeMultiplier
            }
          ]}
        >
          <Text
            fontSize={18 * responsiveSizeMultiplier}
            weight="medium"
            style={[
              flexbox.flex1,
              {
                marginRight: SPACING_TY * responsiveSizeMultiplier
              }
            ]}
            numberOfLines={1}
          >
            {t('Network details')}
          </Text>
          {!!shouldDisplayEditButton && (
            <Button
              style={[
                { maxHeight: 40 * responsiveSizeMultiplier },
                !!shouldDisplayDisableButton && {
                  marginRight: SPACING_TY * responsiveSizeMultiplier
                }
              ]}
              text={t('Edit')}
              type="secondary"
              size="smaller"
              onPress={openBottomSheet as any}
              hasBottomSpacing={false}
              childrenPosition="left"
            >
              <EditPenIcon width={20} height={20} color={theme.primaryText} style={spacings.mrMi} />
            </Button>
          )}
          {!!shouldDisplayDisableButton && (
            <Button
              style={{ maxHeight: 40 * responsiveSizeMultiplier }}
              disabled={statuses.updateNetwork !== 'INITIAL'}
              text={!networkData?.disabled ? t('Disable') : t('Enable')}
              testID="disable-network-btn" // @TODO
              type={!networkData?.disabled ? 'dangerFilled' : 'primary'}
              onPress={() => {
                if (!chainId || !allowRemoveNetwork) return

                toggleNetworkDisabled()
              }}
              hasBottomSpacing={false}
            />
          )}
          {}
        </View>
        <View style={flexbox.flex1}>
          {renderInfoItem(t('Network Name'), name)}
          {renderRpcUrlsItem()}
          {(isAmbireNext || isDev) &&
            renderInfoItem(t('Max batch size'), batchMaxCount?.toString() || 'Unlimited')}
          {renderInfoItem(t('Chain ID'), chainId.toString())}
          {renderInfoItem(t('Currency Symbol'), nativeAssetSymbol)}
          {renderInfoItem(t('Currency Name'), nativeAssetName)}
          {renderInfoItem(t('Block Explorer URL'), explorerUrl, false)}
        </View>
      </View>
      <Dialog
        dialogRef={dialogRef}
        id="disable-network"
        title={t(`Disable ${name}`)}
        text={t(
          `Are you sure you want to disable ${name}? Any assets associated with this network will no longer be visible in your wallet.`
        )}
        closeDialog={closeDialog}
      >
        <DialogFooter horizontalAlignment="justifyEnd">
          <DialogButton text={t('Close')} type="secondary" onPress={() => closeDialog()} />
          <DialogButton
            style={spacings.ml}
            text={t('Disable')}
            testID="disable-network-confirm-btn"
            type="danger"
            onPress={updateNetworkDisabled}
          />
        </DialogFooter>
      </Dialog>
      <BottomSheet
        id="edit-network-bottom-sheet"
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
        scrollViewProps={{
          scrollEnabled: false,
          contentContainerStyle: { flex: 1 }
        }}
        containerInnerWrapperStyles={{ flex: 1 }}
        style={{ ...spacings.ph0, ...spacings.pv0, overflow: 'hidden', maxWidth: 880 }}
      >
        <NetworkForm
          selectedChainId={chainId.toString()}
          onCancel={closeBottomSheet}
          onSaved={closeBottomSheet}
        />
      </BottomSheet>
    </>
  )
}

export default React.memo(NetworkDetails)
