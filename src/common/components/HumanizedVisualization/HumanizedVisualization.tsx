import React, { FC, Fragment, memo, useCallback, useMemo } from 'react'
import { Linking, Pressable, StyleProp, View, ViewStyle } from 'react-native'

import {
  HumanizerErc7730Visualization,
  HumanizerVisualization,
  IrCall
} from '@ambire-common/libs/humanizer/interfaces'
import useBenzinNetworksContext from '@benzin/hooks/useBenzinNetworksContext'
import OpenIcon from '@common/assets/svg/OpenIcon'
import EditApproval from '@common/components/HumanizedVisualization/EditApproval'
import HumanizerAddress from '@common/components/HumanizerAddress'
import Text from '@common/components/Text'
import TokenOrNft from '@common/components/TokenOrNft'
import { isMobile } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings, { SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
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
  dapp?: IrCall['dapp']
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
    <HumanizerAddress
      address={address}
      chainId={chainId}
      fontSize={textSize}
      actionsMode="inline"
      hideLinks={hideLinks}
      hideLogo
    />
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

type Erc7730Row = HumanizerErc7730Visualization['rows'][number]

const isSpenderRow = (row: Erc7730Row) => {
  const label = row.label.trim().toLowerCase()

  return /spender|recipient|receiver|operator/.test(label) || ['to'].includes(label)
}

const isExpirationRow = (row: Erc7730Row) =>
  /expires|expiration|deadline|valid|until/.test(row.label.toLowerCase())

const hasTokenValue = (row: Erc7730Row) => row.value.some((value) => value.type === 'token')

const isOutgoingTokenRow = (row: Erc7730Row) =>
  /send|spend|pay|sell|input|amount in|amount to send/.test(row.label.toLowerCase())

const isIncomingTokenRow = (row: Erc7730Row) =>
  /receive|get|buy|output|amount out|minimum to receive|receive minimum/.test(
    row.label.toLowerCase()
  )

const isSwapLikeTitle = (title?: string) =>
  /swap|exchange|trade|bridge/.test((title || '').toLowerCase())

const isComplexActionRow = (row: Erc7730Row) =>
  /action|call|operation|method/.test(row.label.toLowerCase())

const isActionValue = (value: HumanizerVisualization) => value.type === 'action' && !!value.content

const isToLabelValue = (value: HumanizerVisualization) =>
  value.type === 'label' && value.content?.trim().toLowerCase() === 'to'

const getDetailedActionParts = (row: Erc7730Row) => {
  const action = row.value.find(isActionValue)
  if (!action) return null

  const recipientLabelIndex = row.value.findIndex(
    (value, valueIndex, values) =>
      isToLabelValue(value) && values[valueIndex + 1]?.type === 'address'
  )
  const recipientValues =
    recipientLabelIndex >= 0 ? row.value.slice(recipientLabelIndex, recipientLabelIndex + 2) : []
  const rightValues = row.value.filter(
    (value, valueIndex) =>
      value.id !== action.id &&
      valueIndex !== recipientLabelIndex &&
      valueIndex !== recipientLabelIndex + 1
  )

  return {
    action,
    recipientValues,
    rightValues
  }
}

const getDetailedValueLines = (row: Erc7730Row) =>
  row.value.reduce<HumanizerVisualization[][]>(
    (lines, value, valueIndex, values) => {
      const lastLine = lines[lines.length - 1]
      if (!lastLine) return [[value]]

      const shouldStartRecipientLine =
        isToLabelValue(value) && values[valueIndex + 1]?.type === 'address' && lastLine.length > 0

      if (shouldStartRecipientLine) {
        lines.push([value])
        return lines
      }

      lastLine.push(value)
      return lines
    },
    [[]]
  )

const getErc7730SpenderRow = (item: HumanizerErc7730Visualization) =>
  item.rows.find((row) => isSpenderRow(row))

const shouldShowErc7730SpenderRowInSummary = (item: HumanizerErc7730Visualization) =>
  !isSwapLikeTitle(item.title)

const getErc7730SwapSummaryRows = (item: HumanizerErc7730Visualization) => {
  const tokenRows = item.rows.filter((row) => hasTokenValue(row))
  if (tokenRows.length < 2) return null

  const outgoingRow = tokenRows.find((row) => isOutgoingTokenRow(row))
  const incomingRow = tokenRows.find((row) => isIncomingTokenRow(row))
  const hasDirectionalPair = !!outgoingRow && !!incomingRow && outgoingRow !== incomingRow

  if (!hasDirectionalPair && !isSwapLikeTitle(item.title)) return null

  if (hasDirectionalPair) return [outgoingRow, incomingRow]

  return tokenRows.slice(0, 2)
}

const getErc7730SummaryRows = (item: HumanizerErc7730Visualization) => {
  const swapRows = getErc7730SwapSummaryRows(item)
  if (swapRows) return swapRows

  const amountRow = item.rows.find((row) => hasTokenValue(row))
  if (amountRow) return [amountRow]

  return item.rows.filter((row) => !isSpenderRow(row) && !isExpirationRow(row)).slice(0, 2)
}

export const getErc7730DescriptionRows = (item: HumanizerErc7730Visualization) => {
  const visibleSummaryRows = [
    shouldShowErc7730SpenderRowInSummary(item) ? getErc7730SpenderRow(item) : undefined,
    ...getErc7730SummaryRows(item)
  ].filter((row): row is Erc7730Row => !!row)

  return item.rows.filter((row) => !visibleSummaryRows.includes(row))
}

export const shouldUseErc7730DetailedLayout = (item: HumanizerErc7730Visualization) => {
  if (/multicall|batch|bundle/.test((item.title || '').toLowerCase())) return true

  const summaryRows = getErc7730SummaryRows(item)
  if (summaryRows.some(hasTokenValue)) return false

  const complexActionRows = summaryRows.filter(isComplexActionRow)

  return summaryRows.length > 1 && complexActionRows.length > 1
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

  const renderValue = (valueItem: HumanizerVisualization, overrideTextSize = textSize) => {
    if (!valueItem || ('isHidden' in valueItem && valueItem.isHidden)) return null

    if (valueItem.type === 'token') {
      const tokenChainId = valueItem.chainId || chainId

      if (mode === 'summary') {
        return (
          <View
            key={valueItem.id}
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              flexbox.justifyEnd,
              {
                minWidth: 0,
                maxWidth: '100%'
              }
            ]}
          >
            <TokenOrNft
              sizeMultiplierSize={sizeMultiplierSize}
              value={valueItem.value}
              address={valueItem.address}
              textSize={overrideTextSize}
              chainId={tokenChainId}
              hideLinks
              tokenMarginRight={0}
              tokenIconContainerSize={20}
            />
            {editApprovalCallInfo && (
              <EditApproval
                editCall={editApprovalCallInfo.setter}
                token={editApprovalCallInfo.token}
                value={editApprovalCallInfo.amount}
                id={editApprovalCallInfo.callId}
                style={[spacings.mlTy, spacings.mr0]}
              />
            )}
            <Erc7730StructuredAddressActions
              address={valueItem.address}
              chainId={tokenChainId}
              hideLinks={hideLinks}
            />
          </View>
        )
      }

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
              textSize={overrideTextSize}
              chainId={tokenChainId}
              hideLinks
              tokenMarginRight={0}
              tokenIconContainerSize={20}
            />
            <Erc7730StructuredAddressActions
              address={valueItem.address}
              chainId={tokenChainId}
              hideLinks={hideLinks}
            />
          </View>
        </View>
      )
    }

    if (valueItem.type === 'address' && valueItem.address) {
      return (
        <Erc7730StructuredAddress
          key={valueItem.id}
          address={valueItem.address}
          chainId={valueItem.chainId || chainId}
          textSize={overrideTextSize}
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
          textSize={overrideTextSize}
          hideLinks={hideLinks}
          mode="description"
        />
      )
    }

    if (valueItem.content) {
      return (
        <Text
          key={valueItem.id}
          fontSize={overrideTextSize}
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

  const renderDetailedValueLine = (
    values: HumanizerVisualization[],
    alignment: 'start' | 'end' = 'end'
  ) => (
    <View
      key={values.map((value) => value.id).join('-')}
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        alignment === 'start' ? flexbox.justifyStart : flexbox.justifyEnd,
        flexbox.wrap,
        {
          minWidth: 0,
          maxWidth: '100%'
        }
      ]}
    >
      {values.map((value) => {
        const renderedValue = renderValue(value)
        if (!renderedValue) return null

        const isLastElement = value.id === values[values.length - 1]?.id

        return (
          <View key={value.id} style={!isLastElement && spacings.mrTy}>
            {renderedValue}
          </View>
        )
      })}
    </View>
  )

  if (mode === 'summary') {
    const summaryRows = getErc7730SummaryRows(item)
    const shouldStackSummaryRows = summaryRows.length > 1 && summaryRows.every(hasTokenValue)
    const spenderRow = shouldShowErc7730SpenderRowInSummary(item)
      ? getErc7730SpenderRow(item)
      : undefined
    const subtitleTextSize = Math.max(textSize - 3, 11)

    return (
      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          {
            width: '100%',
            minWidth: 0,
            gap: SPACING_SM
          }
        ]}
      >
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            {
              minWidth: 0,
              flex: 1,
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
          <View
            style={[
              {
                minWidth: 0,
                flexShrink: 1
              }
            ]}
          >
            {!!item.title && (
              <Text
                fontSize={textSize + 2}
                weight="semiBold"
                color={theme.secondaryAccent400}
                numberOfLines={1}
                style={spacings.mrSm}
              >
                {item.title}
              </Text>
            )}
            {spenderRow && (
              <View
                style={[
                  flexbox.directionRow,
                  flexbox.alignCenter,
                  {
                    maxWidth: '100%',
                    minWidth: 0,
                    flexShrink: 1
                  }
                ]}
              >
                <Text
                  fontSize={subtitleTextSize}
                  weight="semiBold"
                  appearance="secondaryText"
                  numberOfLines={1}
                  style={spacings.mrTy}
                >
                  {spenderRow.label}
                </Text>
                <View
                  style={[
                    flexbox.directionRow,
                    flexbox.alignCenter,
                    {
                      minWidth: 0,
                      flexShrink: 1
                    }
                  ]}
                >
                  {spenderRow.value.map((value) => renderValue(value, subtitleTextSize))}
                </View>
              </View>
            )}
          </View>
        </View>
        <View
          style={[
            shouldStackSummaryRows ? flexbox.alignEnd : flexbox.directionRow,
            !shouldStackSummaryRows && flexbox.alignCenter,
            flexbox.justifyEnd,
            {
              minWidth: 0,
              flexShrink: 0,
              ...(shouldStackSummaryRows ? { flexDirection: 'column' } : {})
            }
          ]}
        >
          {summaryRows.map((row, index) => (
            <View
              key={`${item.id}-summary-${row.label}-${row.value
                .map((value) => value.id)
                .join('-')}`}
              style={[
                flexbox.directionRow,
                flexbox.alignCenter,
                flexbox.justifyEnd,
                shouldStackSummaryRows && index > 0 && spacings.mtMi,
                !shouldStackSummaryRows && index > 0 && spacings.mlSm,
                {
                  minWidth: 0,
                  maxWidth: shouldStackSummaryRows ? 520 : index === 0 ? 360 : 260
                }
              ]}
            >
              {(!hasTokenValue(row) || shouldStackSummaryRows) && (
                <Text
                  fontSize={Math.max(textSize - 4, 10)}
                  weight="semiBold"
                  appearance="secondaryText"
                  numberOfLines={1}
                  style={[
                    spacings.mrTy,
                    shouldStackSummaryRows && {
                      flexShrink: 1,
                      maxWidth: 180
                    }
                  ]}
                >
                  {row.label}
                </Text>
              )}
              <View
                style={[
                  flexbox.directionRow,
                  flexbox.alignCenter,
                  flexbox.justifyEnd,
                  {
                    minWidth: 0,
                    maxWidth: '100%'
                  }
                ]}
              >
                {row.value.map((value) => renderValue(value))}
              </View>
            </View>
          ))}
        </View>
      </View>
    )
  }

  return (
    <View style={{ width: '100%' }}>
      {item.rows.map((row) => {
        const actionParts = getDetailedActionParts(row)
        const rowKey = `${item.id}-${row.label}-${row.value.map((value) => value.id).join('-')}`

        if (actionParts) {
          return (
            <View
              key={rowKey}
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
              <View style={{ flex: 1, minWidth: 160 }}>
                <Text
                  fontSize={textSize}
                  weight="semiBold"
                  color={theme.secondaryAccent400}
                  style={{ flexShrink: 1 }}
                >
                  {actionParts.action.content}
                </Text>
                {!!actionParts.recipientValues.length && (
                  <View style={spacings.mtMi}>
                    {renderDetailedValueLine(actionParts.recipientValues, 'start')}
                  </View>
                )}
              </View>
              <View
                style={[
                  flexbox.justifyEnd,
                  flexbox.alignEnd,
                  {
                    flex: 1.6,
                    minWidth: 160
                  }
                ]}
              >
                {getDetailedValueLines({ ...row, value: actionParts.rightValues }).map((line) =>
                  renderDetailedValueLine(line)
                )}
              </View>
            </View>
          )
        }

        return (
          <View
            key={rowKey}
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
                flexbox.justifyEnd,
                flexbox.alignEnd,
                {
                  flex: 1.6,
                  minWidth: 160
                }
              ]}
            >
              {getDetailedValueLines(row).map((line) => renderDetailedValueLine(line))}
            </View>
          </View>
        )
      })}
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
  erc7730Mode = 'summary',
  dapp
}) => {
  const marginRight = SPACING_TY * sizeMultiplierSize
  const { theme } = useTheme()
  const dappIcon = dapp?.icon || undefined
  const shouldShowDappIcon = !!dappIcon && !data.some((item) => item?.type === 'erc7730')

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
      {shouldShowDappIcon && (
        <ManifestImage
          uri={dappIcon}
          containerStyle={spacings.mrSm}
          size={24 * sizeMultiplierSize}
          skeletonAppearance="secondaryBackground"
          imageStyle={{ borderRadius: 12 * sizeMultiplierSize, backgroundColor: 'transparent' }}
        />
      )}
      {data.map((item) => {
        if (!item) return null
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
                actionsMode="inline"
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
