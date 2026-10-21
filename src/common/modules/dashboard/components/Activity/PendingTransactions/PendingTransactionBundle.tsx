import { memo, useCallback, useMemo } from 'react'
import { View } from 'react-native'

import CheckIcon from '@common/assets/svg/CheckIcon'
import EditPenIcon from '@common/assets/svg/EditPenIcon'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import CompactHumanizedCalls from '@common/modules/sign-account-op/components/CompactHumanizedCalls'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

import type { CallsUserRequest } from '@ambire-common/interfaces/userRequest'
import type { FC } from 'react'
interface Props {
  request: CallsUserRequest
  /** Whether the nonce of the transaction is the one that executes next on its chain. A
   * fully signed transaction on a later nonce still has to wait for the ones before it. */
  isCurrentNonce: boolean
}

/**
 * A single pending Safe transaction bundle. Shows the humanized calls it contains, how many
 * of the required signatures it has collected, and opens the sign flow through the Open button.
 */
const PendingTransactionBundle: FC<Props> = ({ request, isCurrentNonce }) => {
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
    <View testID={`pending-transaction-bundle-${request.id}`} style={styles.bundle}>
      {humanization?.length ? (
        <CompactHumanizedCalls
          humanization={humanization}
          chainId={accountOp.chainId}
          textSize={14}
          titleTextSize={16}
          labelTextSize={12}
          labelWeight="medium"
          itemStyle={styles.bundleCard}
        />
      ) : (
        <View style={styles.bundleCard}>
          <Text fontSize={12} appearance="secondaryText">
            {t('Preparing transaction details...')}
          </Text>
        </View>
      )}

      <View
        style={[
          styles.bundleFooter,
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween
        ]}
      >
        <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.wrap, flexbox.flex1]}>
          <Text fontSize={14} weight="medium" appearance="secondaryText" style={spacings.mrTy}>
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
    </View>
  )
}

export default memo(PendingTransactionBundle)
