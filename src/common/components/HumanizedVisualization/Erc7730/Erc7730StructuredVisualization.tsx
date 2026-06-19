import React, { FC, memo, useCallback, useMemo } from 'react'
import { View } from 'react-native'

import { HumanizerVisualization } from '@ambire-common/libs/humanizer/interfaces'
import useNetworksContext from '@benzin/hooks/useBenzinNetworksContext'
import ChainVisualization from '@common/components/HumanizedVisualization/ChainVisualization'
import EditApproval from '@common/components/HumanizedVisualization/EditApproval'
import { Erc7730StructuredVisualizationProps } from '@common/components/HumanizedVisualization/Erc7730/interfaces'
import MobileErc7730SummaryVisualization from '@common/components/HumanizedVisualization/Erc7730/MobileErc7730SummaryVisualization'
import HumanizerAddress from '@common/components/HumanizerAddress'
import Text from '@common/components/Text'
import TokenOrNft from '@common/components/TokenOrNft'
import { isMobile } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import ManifestImage from '@web/components/ManifestImage'

import {
  getDetailedActionParts,
  getDetailedRows,
  getDetailedValueLines,
  getErc7730SpenderRow,
  getErc7730SummaryRows,
  getVisibleErc7730Rows,
  hasErc7730NativeValueRow,
  hasTokenValue,
  isNestedErc7730Row,
  isNestedErc7730Value,
  shouldShowErc7730SpenderRowInSummary,
  shouldShowErc7730SummaryRowLabel
} from './helpers'

const Erc7730StructuredVisualization: FC<Erc7730StructuredVisualizationProps> = ({
  item,
  chainId,
  sizeMultiplierSize,
  textSize,
  mode = 'summary',
  editApprovalCallInfo,
  hideNestedRows = false,
  hideMobileSummaryTitle = false,
  isTransactionSummaryLayout = false,
  hasTransactionSummaryHeaderLeftControl = false,
  hasTransactionSummaryHeaderRightControl = false
}) => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const {
    state: { networks: controllerNetworks }
  } = useController('NetworksController')
  const { benzinNetworks } = useNetworksContext()
  const networks = controllerNetworks ?? benzinNetworks
  const shouldHideTransactionSummaryTitle = isMobile && hideMobileSummaryTitle
  const nativeAssetSymbol = useMemo(
    () => networks.find((network) => network.chainId === chainId)?.nativeAssetSymbol,
    [chainId, networks]
  )
  const hasNativeValueRow = useMemo(() => hasErc7730NativeValueRow(item), [item])
  const getTransactionSummaryRowLabel = useCallback(
    (label: string) => {
      if (!hasNativeValueRow) return label

      // better presentation labels for approvals with native
      if (label === 'Amount') return t('Token Amount')
      if (label === 'Send' && nativeAssetSymbol) {
        return t('{{nativeAssetSymbol}} Amount', { nativeAssetSymbol })
      }

      return label
    },
    [hasNativeValueRow, nativeAssetSymbol, t]
  )
  const detailedRows = useMemo(
    () => getDetailedRows(item).filter((row) => !hideNestedRows || !isNestedErc7730Row(row)),
    [hideNestedRows, item]
  )
  const visibleRows = useMemo(() => getVisibleErc7730Rows(item), [item])
  const getNestedVisualizationMode = useCallback(
    (nestedVisualization: HumanizerVisualization) =>
      nestedVisualization.type === 'erc7730' && nestedVisualization.title === 'Account setup'
        ? 'description'
        : 'summary',
    []
  )

  const renderValue = useCallback(
    (valueItem: HumanizerVisualization, overrideTextSize = textSize): React.ReactNode => {
      if (!valueItem || ('isHidden' in valueItem && valueItem.isHidden)) return null

      if (valueItem.type === 'token') {
        const tokenChainId = valueItem.chainId || chainId
        const shouldShowEditApproval =
          !!editApprovalCallInfo &&
          valueItem.address.toLowerCase() === editApprovalCallInfo.token.toLowerCase()

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
                tokenMarginRight={0}
                tokenIconContainerSize={20}
              />
              {shouldShowEditApproval && (
                <EditApproval
                  editCall={editApprovalCallInfo.setter}
                  token={editApprovalCallInfo.token}
                  value={editApprovalCallInfo.amount}
                  chainId={tokenChainId}
                  id={editApprovalCallInfo.callId}
                  style={[spacings.mlTy, spacings.mr0]}
                />
              )}
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
                tokenMarginRight={0}
                tokenIconContainerSize={20}
              />
              {shouldShowEditApproval && (
                <EditApproval
                  editCall={editApprovalCallInfo.setter}
                  token={editApprovalCallInfo.token}
                  value={editApprovalCallInfo.amount}
                  chainId={tokenChainId}
                  id={editApprovalCallInfo.callId}
                  style={[spacings.mlTy, spacings.mr0]}
                />
              )}
            </View>
          </View>
        )
      }

      if (valueItem.type === 'address' && valueItem.address) {
        return (
          <HumanizerAddress
            key={valueItem.id}
            address={valueItem.address}
            chainId={valueItem.chainId || chainId}
            fontSize={overrideTextSize}
            actionsMode="inline"
            shouldWrapInlineActions={false}
            hideLogo
          />
        )
      }

      if (valueItem.type === 'chain' && valueItem.chainId) {
        return <ChainVisualization chainId={valueItem.chainId} key={valueItem.id} marginRight={0} />
      }

      if (valueItem.type === 'erc7730') {
        return (
          <Erc7730StructuredVisualization
            key={valueItem.id}
            item={valueItem}
            chainId={chainId}
            sizeMultiplierSize={sizeMultiplierSize}
            textSize={overrideTextSize}
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
            style={[{ textAlign: 'right', flexShrink: 1 }, valueItem.mlMi && spacings.mlMi]}
          >
            {valueItem.content}
          </Text>
        )
      }

      return null
    },
    [chainId, editApprovalCallInfo, mode, sizeMultiplierSize, textSize, theme]
  )

  const renderDetailedValueLine = useCallback(
    (values: HumanizerVisualization[], alignment: 'start' | 'end' = 'end') => (
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
    ),
    [renderValue]
  )

  if (mode === 'summary') {
    if (isTransactionSummaryLayout) {
      return (
        <View style={{ width: '100%', minWidth: 0 }}>
          {!shouldHideTransactionSummaryTitle && (
            <View
              style={[
                flexbox.directionRow,
                flexbox.alignCenter,
                {
                  minWidth: 0,
                  paddingLeft: hasTransactionSummaryHeaderLeftControl ? 28 + SPACING_TY : 0,
                  paddingRight: hasTransactionSummaryHeaderRightControl ? 28 + SPACING_TY : 0
                }
              ]}
            >
              {!!item.dapp?.icon && (
                <ManifestImage
                  uri={item.dapp.icon}
                  containerStyle={spacings.mrTy}
                  size={24 * sizeMultiplierSize}
                  skeletonAppearance="secondaryBackground"
                  imageStyle={{
                    borderRadius: 12 * sizeMultiplierSize,
                    backgroundColor: 'transparent'
                  }}
                  hideOnError
                />
              )}
              {!!item.title && (
                <Text
                  fontSize={textSize + 2}
                  weight="semiBold"
                  color={theme.secondaryAccent400}
                  numberOfLines={1}
                  style={{ flexShrink: 1 }}
                >
                  {item.title}
                </Text>
              )}
            </View>
          )}
          <View
            style={[
              !shouldHideTransactionSummaryTitle && {
                marginTop: SPACING_TY * sizeMultiplierSize
              },
              { width: '100%', minWidth: 0 }
            ]}
          >
            {visibleRows.map((row) => (
              <View
                key={`${item.id}-transaction-summary-${row.label}-${row.value
                  .map((value) => value.id)
                  .join('-')}`}
                style={[
                  flexbox.directionRow,
                  flexbox.alignCenter,
                  flexbox.justifySpaceBetween,
                  { marginTop: SPACING_SM * sizeMultiplierSize },
                  { width: '100%', minWidth: 0 }
                ]}
              >
                {!!row.label.trim() && (
                  <Text
                    fontSize={12}
                    weight="regular"
                    appearance="secondaryText"
                    style={[spacings.mrSm, { flexShrink: 1 }]}
                  >
                    {getTransactionSummaryRowLabel(row.label)}
                  </Text>
                )}
                <View
                  style={[
                    flexbox.directionRow,
                    flexbox.alignCenter,
                    flexbox.justifyEnd,
                    flexbox.wrap,
                    { minWidth: 0, flexShrink: 1 }
                  ]}
                >
                  {row.value.map((value, valueIndex) => (
                    <View key={value.id} style={valueIndex > 0 && spacings.mlTy}>
                      {renderValue(value)}
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>
      )
    }

    const summaryRows = getErc7730SummaryRows(item)
    const shouldStackSummaryRows = summaryRows.length > 1 && summaryRows.every(hasTokenValue)
    const spenderRow = shouldShowErc7730SpenderRowInSummary(item)
      ? getErc7730SpenderRow(item)
      : undefined
    const subtitleTextSize = Math.max(textSize - 3, 11)

    if (isMobile) {
      return (
        <MobileErc7730SummaryVisualization
          item={item}
          summaryRows={summaryRows}
          spenderRow={spenderRow}
          sizeMultiplierSize={sizeMultiplierSize}
          textSize={textSize}
          renderValue={renderValue}
          hideTitle={hideMobileSummaryTitle}
        />
      )
    }

    return (
      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          {
            width: '100%',
            minWidth: 0,
            alignItems: 'center'
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
              marginRight: SPACING_SM
            }
          ]}
        >
          {!!item.dapp?.icon && (
            <ManifestImage
              uri={item.dapp.icon}
              containerStyle={{ marginRight: SPACING_TY }}
              size={24 * sizeMultiplierSize}
              skeletonAppearance="secondaryBackground"
              imageStyle={{ borderRadius: 12 * sizeMultiplierSize, backgroundColor: 'transparent' }}
              hideOnError
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
              {shouldShowErc7730SummaryRowLabel(item, row) &&
                (!hasTokenValue(row) || shouldStackSummaryRows) && (
                  <Text
                    fontSize={Math.max(textSize - 4, 10)}
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

  if (isMobile) {
    return (
      <View style={{ width: '100%' }}>
        {detailedRows.map((row) => {
          const actionParts = getDetailedActionParts(row)
          const rowKey = `${item.id}-${row.label}-${row.value.map((value) => value.id).join('-')}`

          if (isNestedErc7730Row(row)) {
            const nestedVisualizations = row.value.filter(isNestedErc7730Value)

            return (
              <View key={rowKey} style={{ width: '100%', paddingVertical: SPACING_TY }}>
                {!!row.label.trim() && (
                  <Text fontSize={textSize} appearance="secondaryText" style={spacings.mbTy}>
                    {row.label}
                  </Text>
                )}
                <View style={{ width: '100%' }}>
                  {nestedVisualizations.map((nestedVisualization, nestedIndex) => (
                    <View
                      key={nestedVisualization.id}
                      style={[
                        nestedIndex > 0 && {
                          marginTop: SPACING_TY,
                          paddingTop: SPACING_TY
                        }
                      ]}
                    >
                      <Erc7730StructuredVisualization
                        item={nestedVisualization}
                        chainId={chainId}
                        sizeMultiplierSize={sizeMultiplierSize}
                        textSize={textSize}
                        mode={getNestedVisualizationMode(nestedVisualization)}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )
          }

          if (actionParts) {
            return (
              <View key={rowKey} style={{ width: '100%', paddingVertical: SPACING_TY }}>
                <Text fontSize={textSize} color={theme.secondaryAccent400}>
                  {actionParts.action.content}
                </Text>
                {!!actionParts.recipientValues.length && (
                  <View style={spacings.mtMi}>
                    {renderDetailedValueLine(actionParts.recipientValues, 'start')}
                  </View>
                )}
                {getDetailedValueLines({ ...row, value: actionParts.rightValues })
                  .filter((line) => line.length)
                  .map((line) => (
                    <View key={line.map((value) => value.id).join('-')} style={spacings.mtMi}>
                      {renderDetailedValueLine(line, 'start')}
                    </View>
                  ))}
              </View>
            )
          }

          return (
            <View key={rowKey} style={{ width: '100%', paddingVertical: SPACING_TY }}>
              {!!row.label.trim() && (
                <Text fontSize={textSize} appearance="secondaryText" style={spacings.mbMi}>
                  {row.label}
                </Text>
              )}
              {getDetailedValueLines(row).map((line) => renderDetailedValueLine(line, 'start'))}
            </View>
          )
        })}
      </View>
    )
  }

  return (
    <View style={{ width: '100%' }}>
      {detailedRows.map((row) => {
        const actionParts = getDetailedActionParts(row)
        const rowKey = `${item.id}-${row.label}-${row.value.map((value) => value.id).join('-')}`

        if (isNestedErc7730Row(row)) {
          const nestedVisualizations = row.value.filter(isNestedErc7730Value)

          return (
            <View key={rowKey} style={{ width: '100%', paddingVertical: SPACING_TY }}>
              {!!row.label.trim() && (
                <Text fontSize={textSize} appearance="secondaryText" style={spacings.mbTy}>
                  {row.label}
                </Text>
              )}
              <View style={{ width: '100%' }}>
                {nestedVisualizations.map((nestedVisualization, nestedIndex) => (
                  <View
                    key={nestedVisualization.id}
                    style={[
                      flexbox.directionRow,
                      flexbox.alignCenter,
                      nestedIndex > 0 && {
                        marginTop: SPACING_TY,
                        paddingTop: SPACING_TY
                      }
                    ]}
                  >
                    <Erc7730StructuredVisualization
                      item={nestedVisualization}
                      chainId={chainId}
                      sizeMultiplierSize={sizeMultiplierSize}
                      textSize={textSize}
                      mode={getNestedVisualizationMode(nestedVisualization)}
                    />
                  </View>
                ))}
              </View>
            </View>
          )
        }

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
                  paddingVertical: SPACING_TY,
                  flexWrap: 'wrap'
                }
              ]}
            >
              <View style={{ flex: 1, minWidth: 160, marginRight: SPACING_SM }}>
                <Text
                  fontSize={textSize}
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
                paddingVertical: SPACING_TY,
                flexWrap: 'wrap'
              }
            ]}
          >
            <Text
              fontSize={textSize}
              appearance="secondaryText"
              style={{ flex: 1, minWidth: 120, marginRight: SPACING_SM }}
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

export default memo(Erc7730StructuredVisualization)
