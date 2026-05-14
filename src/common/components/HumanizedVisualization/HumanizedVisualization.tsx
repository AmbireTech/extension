import React, { FC, Fragment, memo, useCallback, useMemo } from 'react'
import { Linking, Pressable, StyleProp, View, ViewStyle } from 'react-native'

import {
  HumanizerErc7730Visualization,
  HumanizerVisualization,
  IrCall
} from '@ambire-common/libs/humanizer/interfaces'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import useBenzinNetworksContext from '@benzin/hooks/useBenzinNetworksContext'
import CopyIcon from '@common/assets/svg/CopyIcon'
import OpenIcon from '@common/assets/svg/OpenIcon'
import EditApproval from '@common/components/HumanizedVisualization/EditApproval'
import HumanizerAddress from '@common/components/HumanizerAddress'
import Text from '@common/components/Text'
import TokenOrNft from '@common/components/TokenOrNft'
import { isMobile, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings, { SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { setStringAsync } from '@common/utils/clipboard'
import { openInTab } from '@common/utils/links'
import ImageIcon from '@web/assets/svg/ImageIcon'
import ManifestImage from '@web/components/ManifestImage'
import { isExtension } from '@web/constants/browserapi'

import { COLLECTIBLE_SIZE } from '../Collectible/styles'
import ChainVisualization from './ChainVisualization/ChainVisualization'
import DeadlineItem from './DeadlineItem'

function stopPropagation(e: React.MouseEvent) {
  e.stopPropagation()
}

function stopPressPropagation(e?: { stopPropagation?: () => void }) {
  e?.stopPropagation?.()
}

interface Props {
  data: IrCall['fullVisualization']
  sizeMultiplierSize?: number
  textSize?: number
  chainId: bigint
  type?: 'history' | 'benzin' | 'default'
  testID?: string
  hasPadding?: boolean
  imageSize?: number
  hideLinks?: boolean
  style?: StyleProp<ViewStyle>
  erc7730Mode?: 'summary' | 'description'
  editApprovalCallInfo?: {
    setter: (arg: string, token: string, closeModal: () => void) => void
    amount: bigint
    token: string
    callId?: string
  }
}

type EditApprovalCallInfo = NonNullable<Props['editApprovalCallInfo']>

interface Erc7730StructuredAddressActionsProps {
  address: string
  chainId: bigint
  hideLinks?: boolean
}

const Erc7730StructuredAddressActions: FC<Erc7730StructuredAddressActionsProps> = ({
  address,
  chainId,
  hideLinks = false
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { addToast } = useToast()
  const { benzinNetworks } = useBenzinNetworksContext()
  const {
    state: { networks }
  } = useController('NetworksController')

  const actualNetworks = networks ?? benzinNetworks
  const network = useMemo(
    () => actualNetworks?.find((n) => n.chainId === chainId),
    [actualNetworks, chainId]
  )

  const handleCopyAddress = useCallback(async () => {
    try {
      await setStringAsync(address)
      addToast(t('Address copied to clipboard'))
    } catch {
      addToast(t('Failed to copy address'), {
        type: 'error'
      })
    }
  }, [addToast, address, t])

  const handleOpenExplorer = useCallback(async () => {
    if (!network?.explorerUrl) return

    try {
      const targetUrl = `${network.explorerUrl}/address/${address}`

      if (!isExtension) {
        await Linking.openURL(targetUrl)
        return
      }

      await openInTab({ url: targetUrl })
    } catch {
      addToast(t('Failed to open explorer'), {
        type: 'error'
      })
    }
  }, [addToast, address, network?.explorerUrl, t])

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('Copy Address')}
        onPress={(e) => {
          stopPressPropagation(e)
          void handleCopyAddress()
        }}
        style={[spacings.mlTy, flexbox.center]}
      >
        {({ hovered }: any) => (
          <CopyIcon
            color={hovered ? theme.primaryText : theme.secondaryText}
            width={16}
            height={16}
          />
        )}
      </Pressable>
      {!!network?.explorerUrl && !hideLinks && (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={t('View in Explorer')}
          onPress={(e) => {
            stopPressPropagation(e)
            void handleOpenExplorer()
          }}
          style={[spacings.mlTy, flexbox.center]}
        >
          {({ hovered }: any) => (
            <OpenIcon
              color={hovered ? theme.primaryText : theme.secondaryText}
              width={16}
              height={16}
            />
          )}
        </Pressable>
      )}
    </>
  )
}

interface Erc7730StructuredAddressProps {
  address: string
  chainId: bigint
  textSize: number
  hideLinks?: boolean
}

const Erc7730StructuredAddress: FC<Erc7730StructuredAddressProps> = ({
  address,
  chainId,
  textSize,
  hideLinks = false
}) => {
  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter, { maxWidth: '100%' }]}>
      <Text
        fontSize={textSize}
        weight="medium"
        appearance="linkText"
        selectable
        style={{
          flexShrink: 1,
          ...(isWeb ? { wordBreak: 'break-all' } : {})
        }}
      >
        {shortenAddress(address, 18, 4)}
      </Text>
      <Erc7730StructuredAddressActions address={address} chainId={chainId} hideLinks={hideLinks} />
    </View>
  )
}

interface Erc7730StructuredVisualizationProps {
  item: HumanizerErc7730Visualization & { id: number }
  chainId: bigint
  sizeMultiplierSize: number
  textSize: number
  hideLinks?: boolean
  mode?: 'summary' | 'description'
  editApprovalCallInfo?: EditApprovalCallInfo
}

const getErc7730SummaryRows = (item: HumanizerErc7730Visualization) => {
  const selectedRows = [
    item.rows.find((row) => /spender|operator|recipient|receiver|to/.test(row.label.toLowerCase())),
    item.rows.find((row) => row.value.some((value) => value.type === 'token')),
    item.rows.find((row) => /expires|expiration|deadline|valid|until/.test(row.label.toLowerCase()))
  ].filter((row): row is HumanizerErc7730Visualization['rows'][number] => !!row)

  const uniqueRows = selectedRows.filter(
    (row, index) => selectedRows.findIndex((selectedRow) => selectedRow === row) === index
  )

  return uniqueRows.length ? uniqueRows : item.rows.slice(0, 3)
}

const Erc7730StructuredVisualization: FC<Erc7730StructuredVisualizationProps> = ({
  item,
  chainId,
  sizeMultiplierSize,
  textSize,
  hideLinks = false,
  mode = 'summary',
  editApprovalCallInfo
}) => {
  const { theme } = useTheme()

  const renderValue = (valueItem: HumanizerVisualization) => {
    if (!valueItem || valueItem.isHidden) return null

    if (valueItem.type === 'token') {
      const tokenChainId = valueItem.chainId || chainId

      return (
        <View
          key={valueItem.id}
          style={[
            flexbox.alignEnd,
            {
              minWidth: 0,
              maxWidth: '100%'
            }
          ]}
        >
          <View
            style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifyEnd, flexbox.wrap]}
          >
            <TokenOrNft
              sizeMultiplierSize={sizeMultiplierSize}
              value={valueItem.value}
              address={valueItem.address}
              textSize={textSize}
              chainId={tokenChainId}
              hideLinks
              tokenMarginRight={0}
            />
            <Erc7730StructuredAddressActions
              address={valueItem.address}
              chainId={tokenChainId}
              hideLinks={hideLinks}
            />
          </View>
          {mode === 'summary' && editApprovalCallInfo && (
            <View style={[flexbox.directionRow, flexbox.justifyEnd, spacings.mtMi]}>
              <EditApproval
                editCall={editApprovalCallInfo.setter}
                token={editApprovalCallInfo.token}
                value={editApprovalCallInfo.amount}
                id={editApprovalCallInfo.callId}
              />
            </View>
          )}
        </View>
      )
    }

    if (valueItem.type === 'address' && valueItem.address) {
      return (
        <Erc7730StructuredAddress
          key={valueItem.id}
          address={valueItem.address}
          chainId={valueItem.chainId || chainId}
          textSize={textSize}
          hideLinks={hideLinks}
        />
      )
    }

    if (valueItem.type === 'chain' && valueItem.chainId) {
      return (
        <ChainVisualization
          chainId={valueItem.chainId}
          key={valueItem.id}
          marginRight={0}
          hideLinks={hideLinks}
        />
      )
    }

    if (valueItem.type === 'erc7730') {
      return (
        <Erc7730StructuredVisualization
          key={valueItem.id}
          item={valueItem}
          chainId={chainId}
          sizeMultiplierSize={sizeMultiplierSize}
          textSize={textSize}
          hideLinks={hideLinks}
          mode="description"
        />
      )
    }

    if (valueItem.content) {
      return (
        <Text
          key={valueItem.id}
          fontSize={textSize}
          weight={valueItem.isBold || valueItem.type === 'action' ? 'semiBold' : 'medium'}
          color={
            valueItem.warning
              ? theme.warningText
              : valueItem.type === 'label'
                ? theme.secondaryText
                : valueItem.type === 'action'
                  ? theme.secondaryAccent400
                  : theme.primaryText
          }
          style={{ textAlign: 'right', flexShrink: 1 }}
        >
          {valueItem.content}
        </Text>
      )
    }

    return null
  }

  if (mode === 'summary') {
    const summaryRows = getErc7730SummaryRows(item)

    return (
      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          flexbox.wrap,
          {
            width: '100%',
            gap: SPACING_SM
          }
        ]}
      >
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            {
              minWidth: 160,
              flexShrink: 1,
              gap: SPACING_TY
            }
          ]}
        >
          {!!item.dapp?.icon && (
            <ManifestImage
              uri={item.dapp.icon}
              size={24 * sizeMultiplierSize}
              skeletonAppearance="secondaryBackground"
              imageStyle={{ borderRadius: 12 * sizeMultiplierSize, backgroundColor: 'transparent' }}
            />
          )}
          <View style={{ minWidth: 0, flexShrink: 1 }}>
            {!!item.title && (
              <Text
                fontSize={textSize + 2}
                weight="semiBold"
                color={theme.secondaryAccent400}
                numberOfLines={1}
              >
                {item.title}
              </Text>
            )}
            {!!item.dapp?.name && (
              <Text
                fontSize={Math.max(textSize - 3, 11)}
                weight="medium"
                appearance="secondaryText"
                numberOfLines={1}
              >
                {`via ${item.dapp.name}`}
              </Text>
            )}
          </View>
        </View>
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            flexbox.justifyEnd,
            flexbox.wrap,
            {
              flex: 1,
              minWidth: 260,
              gap: SPACING_SM
            }
          ]}
        >
          {summaryRows.map((row, index) => (
            <View
              key={`${item.id}-summary-${row.label}-${index}`}
              style={[
                flexbox.alignEnd,
                {
                  minWidth: index === 0 ? 128 : 96,
                  maxWidth: index === 0 ? 190 : 260
                }
              ]}
            >
              <Text
                fontSize={Math.max(textSize - 4, 10)}
                weight="semiBold"
                appearance="secondaryText"
                numberOfLines={1}
              >
                {row.label}
              </Text>
              <View
                style={[
                  flexbox.directionRow,
                  flexbox.alignCenter,
                  flexbox.justifyEnd,
                  flexbox.wrap,
                  {
                    maxWidth: '100%'
                  }
                ]}
              >
                {row.value.map(renderValue)}
              </View>
            </View>
          ))}
        </View>
      </View>
    )
  }

  return (
    <View style={{ width: '100%' }}>
      {item.rows.map((row, index) => (
        <View
          key={`${item.id}-${row.label}-${index}`}
          style={[
            flexbox.directionRow,
            flexbox.justifySpaceBetween,
            flexbox.alignStart,
            {
              width: '100%',
              gap: SPACING_SM,
              paddingVertical: SPACING_TY,
              flexWrap: 'wrap'
            }
          ]}
        >
          <Text
            fontSize={textSize}
            weight="semiBold"
            appearance="secondaryText"
            style={{ flex: 1, minWidth: 120 }}
          >
            {row.label}
          </Text>
          <View
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              flexbox.justifyEnd,
              flexbox.wrap,
              {
                flex: 1.6,
                minWidth: 160
              }
            ]}
          >
            {row.value.map(renderValue)}
          </View>
        </View>
      ))}
    </View>
  )
}

const HumanizedVisualization: FC<Props> = ({
  data = [],
  editApprovalCallInfo,
  sizeMultiplierSize = 1,
  textSize = 16,
  chainId,
  type = 'default',
  testID,
  hasPadding = true,
  imageSize = 36,
  hideLinks = false,
  style,
  erc7730Mode = 'summary'
}) => {
  const marginRight = SPACING_TY * sizeMultiplierSize
  const { theme } = useTheme()

  return (
    <View
      testID={testID}
      style={[
        flexbox.flex1,
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.wrap,
        {
          marginHorizontal: hasPadding
            ? (isMobile ? SPACING_TY : SPACING_SM) * sizeMultiplierSize
            : 0
        },
        style
      ]}
    >
      {data.map((item) => {
        if (!item || item.isHidden) return null
        const key = item.id
        if (item.type === 'erc7730') {
          return (
            <Erc7730StructuredVisualization
              key={key}
              item={item}
              chainId={chainId}
              sizeMultiplierSize={sizeMultiplierSize}
              textSize={textSize}
              hideLinks={hideLinks}
              mode={erc7730Mode}
              editApprovalCallInfo={editApprovalCallInfo}
            />
          )
        }

        if (item.type === 'token') {
          return (
            <Fragment key={key}>
              <TokenOrNft
                sizeMultiplierSize={sizeMultiplierSize}
                value={item.value}
                address={item.address!}
                textSize={textSize}
                chainId={chainId}
                hideLinks={hideLinks}
              />
              {editApprovalCallInfo && (
                <EditApproval
                  editCall={editApprovalCallInfo.setter}
                  token={editApprovalCallInfo.token}
                  value={editApprovalCallInfo.amount}
                  id={editApprovalCallInfo.callId}
                />
              )}
            </Fragment>
          )
        }

        if (item.type === 'address' && item.address) {
          return (
            <View key={key} style={{ flexShrink: 1, marginRight }}>
              <HumanizerAddress
                fontSize={textSize}
                address={item.address}
                chainId={chainId}
                verification={item.verification}
              />
            </View>
          )
        }

        if (item.type === 'deadline' && item.value && type !== 'default')
          return (
            <DeadlineItem
              key={key}
              deadline={item.value}
              textSize={textSize}
              marginRight={marginRight}
            />
          )
        if (item.type === 'chain' && item.chainId)
          return (
            <ChainVisualization
              chainId={item.chainId}
              key={key}
              marginRight={marginRight}
              hideLinks={hideLinks}
            />
          )

        if (item.type === 'image' && item.content) {
          return (
            <ManifestImage
              key={key}
              uri={item.content}
              containerStyle={spacings.mrSm}
              size={imageSize}
              skeletonAppearance="primaryBackground"
              fallback={() => (
                <View
                  style={[
                    flexbox.flex1,
                    flexbox.center,
                    { backgroundColor: theme.primaryBackground, width: '100%' }
                  ]}
                >
                  <ImageIcon
                    color={theme.secondaryText}
                    width={COLLECTIBLE_SIZE / 2}
                    height={COLLECTIBLE_SIZE / 2}
                  />
                </View>
              )}
              imageStyle={{
                borderRadius: BORDER_RADIUS_PRIMARY,
                backgroundColor: 'transparent',
                marginRight: 0
              }}
            />
          )
        }
        if (item.type === 'link' && !hideLinks) {
          const content = (
            <Text
              fontSize={textSize}
              weight="semiBold"
              appearance="successText"
              onPress={isMobile ? () => openInTab({ url: item.url! }) : undefined}
            >
              {item.content}
            </Text>
          )

          if (isMobile) {
            return (
              <View key={key} style={{ maxWidth: '100%', marginRight }}>
                {content}
              </View>
            )
          }

          return (
            <a
              onClick={stopPropagation}
              style={{ maxWidth: '100%', marginRight }}
              key={key}
              href={item.url!}
            >
              {content}
            </a>
          )
        }
        if (item.content) {
          return (
            <Text
              key={key}
              style={{ maxWidth: '100%', marginRight }}
              fontSize={textSize}
              weight={item.isBold || item.type === 'action' ? 'semiBold' : 'regular'}
              color={
                item.warning
                  ? theme.warningText
                  : item.type === 'label'
                    ? theme.secondaryText
                    : item.type === 'action'
                      ? theme.secondaryAccent400
                      : theme.primaryText
              }
            >
              {item.content}
            </Text>
          )
        }

        if (item.type === 'break') {
          return <View key={key} style={{ flexBasis: '100%', height: 0 }} />
        }

        return null
      })}
    </View>
  )
}

export default memo(HumanizedVisualization)
