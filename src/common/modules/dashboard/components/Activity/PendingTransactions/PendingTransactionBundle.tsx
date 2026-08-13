import { LinearGradient } from 'expo-linear-gradient'
import React, { FC, useCallback, useMemo } from 'react'
import { View } from 'react-native'

import { CallsUserRequest } from '@ambire-common/interfaces/userRequest'
import CheckIcon from '@common/assets/svg/CheckIcon'
import EditPenIcon from '@common/assets/svg/EditPenIcon'
import Button from '@common/components/Button'
import HoverablePressable from '@common/components/HoverablePressable'
import HumanizedVisualization from '@common/components/HumanizedVisualization'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import FallbackVisualization from '@common/modules/sign-account-op/components/TransactionSummary/FallbackVisualization'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { hexToRgba } from '@common/styles/utils/common'

import getStyles from './styles'

interface Props {
  request: CallsUserRequest
  /** Whether the nonce of the transaction is the one that executes next on its chain. A
   * fully signed transaction on a later nonce still has to wait for the ones before it. */
  isCurrentNonce: boolean
  /** Whether the bundle is the only one on its nonce. It then fills the chain box, instead
   * of being drawn as a card inside it. */
  isOnlyBundle: boolean
  /** Whether the balance preview of the dashboard is built with this transaction. Exactly
   * one bundle per nonce is simulated, because only one of them can happen. */
  isSimulated: boolean
  /** Whether an OR divider floats above the bundle. Half of the height of the divider is
   * then reserved by the bundle, so that the divider needs no background of its own. */
  hasDividerAbove: boolean
  /** Whether an OR divider floats below the bundle. */
  hasDividerBelow: boolean
}

/**
 * A single pending Safe transaction bundle. Shows the humanized calls it contains, how many
 * of the required signatures it has collected, and opens the sign flow through the Open button.
 */
const PendingTransactionBundle: FC<Props> = ({
  request,
  isCurrentNonce,
  isOnlyBundle,
  isSimulated,
  hasDividerAbove,
  hasDividerBelow
}) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const { dispatch: requestsDispatch } = useController('RequestsController')
  const { accountOp, humanization, threshold, accountKeyStoreKeys } = request.signAccountOp

  // The same owner can be listed more than once, so the addresses are counted as a set
  const signedOwners = useMemo(
    () => new Set((accountOp.signed || []).map((addr) => addr.toLowerCase())),
    [accountOp.signed]
  )
  const signedCount = signedOwners.size
  const hasAllSignatures = threshold > 0 && signedCount >= threshold
  // Signing again adds nothing once the required signatures are collected
  const canSign =
    !hasAllSignatures &&
    accountKeyStoreKeys.some((key) => !signedOwners.has(key.addr.toLowerCase()))

  const handleOpen = useCallback(() => {
    requestsDispatch({
      type: 'method',
      params: { method: 'setCurrentUserRequestById', args: [request.id] }
    })
  }, [request.id, requestsDispatch])

  const handlePreview = useCallback(() => {
    requestsDispatch({
      type: 'method',
      params: { method: 'selectSafeSimulationRequest', args: [request.id] }
    })
  }, [request.id, requestsDispatch])

  // The sheen marks the transaction the balance preview is built with. A lone bundle is
  // always the one, so it always keeps it
  const isHighlighted = isOnlyBundle || isSimulated
  let cardStyle = styles.bundleNotSimulated
  if (isOnlyBundle) cardStyle = styles.onlyBundle
  else if (isSimulated) cardStyle = styles.bundle

  return (
    <LinearGradient
      testID={`pending-transaction-bundle-${request.id}`}
      // A soft diagonal sheen, so a pending transaction stands out from the executed ones
      colors={
        isHighlighted
          ? [
              hexToRgba(theme.primaryAccent, 0.14),
              hexToRgba(theme.primaryAccent, 0.03),
              hexToRgba(theme.primaryAccent, 0.1)
            ]
          : [
              hexToRgba(theme.secondaryBackground, 0),
              hexToRgba(theme.secondaryBackground, 0),
              hexToRgba(theme.secondaryBackground, 0)
            ]
      }
      locations={[0, 0.55, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        cardStyle,
        spacings.phSm,
        spacings.pvSm,
        hasDividerAbove && styles.bundleWithDividerAbove,
        hasDividerBelow && styles.bundleWithDividerBelow
      ]}
    >
      {!isOnlyBundle && (
        <HoverablePressable
          testID={`pending-transaction-preview-${request.id}`}
          accessibilityRole="radio"
          accessibilityState={{ checked: isSimulated }}
          accessibilityLabel={t('Show the token changes of this transaction')}
          onPress={handlePreview}
          style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbTy]}
        >
          <View style={[styles.radio, flexbox.center, isSimulated && styles.radioSelected]}>
            {isSimulated && <View style={styles.radioDot} />}
          </View>
          <Text
            fontSize={12}
            weight="medium"
            color={isSimulated ? theme.primaryAccent : undefined}
            style={spacings.mlTy}
          >
            {isSimulated ? t('Simulating this one') : t('Simulate this one')}
          </Text>
        </HoverablePressable>
      )}

      {humanization?.length ? (
        humanization.map((call, index) => (
          <View
            key={call.id}
            style={[
              styles.humanizationItem,
              spacings.phTy,
              spacings.pvTy,
              index !== humanization.length - 1 && spacings.mbTy
            ]}
          >
            {call.fullVisualization?.length ? (
              <HumanizedVisualization
                data={call.fullVisualization}
                chainId={accountOp.chainId}
                sizeMultiplierSize={0.5}
                textSize={12}
                imageSize={12}
                hasPadding={false}
                disableFlex
                style={flexbox.wrap}
                dapp={call.dapp}
              />
            ) : (
              <FallbackVisualization
                call={call}
                sizeMultiplierSize={0.5}
                textSize={12}
                hasPadding={false}
              />
            )}
          </View>
        ))
      ) : (
        <Text fontSize={12} appearance="secondaryText">
          {t('Preparing transaction details...')}
        </Text>
      )}

      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          spacings.mtSm
        ]}
      >
        <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.wrap, flexbox.flex1]}>
          <Text fontSize={12} weight="medium" appearance="secondaryText" style={spacings.mrTy}>
            {t('{{signedCount}}/{{threshold}} signatures', { signedCount, threshold })}
          </Text>
          {hasAllSignatures && isCurrentNonce && (
            <View
              style={[
                styles.readyPill,
                flexbox.directionRow,
                flexbox.alignCenter,
                spacings.phMi,
                spacings.mrTy
              ]}
            >
              <CheckIcon width={12} height={12} color={theme.successText} />
              <Text fontSize={11} weight="medium" color={theme.successText} style={spacings.mlMi}>
                {t('Ready to execute')}
              </Text>
            </View>
          )}
          {canSign && (
            <View
              style={[
                styles.canSignPill,
                flexbox.directionRow,
                flexbox.alignCenter,
                spacings.phMi,
                spacings.mrTy
              ]}
            >
              <EditPenIcon width={12} height={12} color={theme.primaryAccent} />
              <Text fontSize={11} weight="medium" color={theme.primaryAccent} style={spacings.mlMi}>
                {t('You can sign')}
              </Text>
            </View>
          )}
        </View>

        <Button
          testID={`pending-transaction-open-${request.id}`}
          type="primary"
          size="small"
          text={t('Open')}
          onPress={handleOpen}
          hasBottomSpacing={false}
          style={[spacings.ml, { minWidth: 76, height: 40 }]}
        />
      </View>
    </LinearGradient>
  )
}

export default React.memo(PendingTransactionBundle)
