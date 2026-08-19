import { LinearGradient } from 'expo-linear-gradient'
import React, { FC, useCallback, useMemo } from 'react'
import { View } from 'react-native'

import { CallsUserRequest } from '@ambire-common/interfaces/userRequest'
import CheckIcon from '@common/assets/svg/CheckIcon'
import EditPenIcon from '@common/assets/svg/EditPenIcon'
import Button from '@common/components/Button'
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

  return (
    <LinearGradient
      testID={`pending-transaction-bundle-${request.id}`}
      // A soft diagonal sheen, so a pending transaction stands out from the executed ones
      colors={[
        hexToRgba(theme.primaryAccent, 0.14),
        hexToRgba(theme.primaryAccent, 0.03),
        hexToRgba(theme.primaryAccent, 0.1)
      ]}
      locations={[0, 0.55, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.bundle,
        spacings.phSm,
        spacings.pvSm,
        hasDividerAbove && styles.bundleWithDividerAbove,
        hasDividerBelow && styles.bundleWithDividerBelow
      ]}
    >
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
                isErc7730TransactionSummaryLayout
                disableFlex
                style={{ width: '100%', minWidth: 0 }}
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
