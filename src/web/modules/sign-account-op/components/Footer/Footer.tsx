import React, { useMemo } from 'react'
import { View } from 'react-native'

import BatchIcon from '@common/assets/svg/BatchIcon'
import Button from '@common/components/Button'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useMainControllerState from '@web/hooks/useMainControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import useSignAccountOpControllerState from '@web/hooks/useSignAccountOpControllerState'
import ActionsPagination from '@web/modules/action-requests/components/ActionsPagination'

import getStyles from './styles'

type Props = {
  onReject: () => void
  onAddToCart: () => void
  onSign: () => void
  isSignLoading: boolean
  isSignDisabled: boolean
  isAddToCartDisplayed: boolean
  isAddToCartDisabled: boolean
  inProgressButtonText: string
}

const Footer = ({
  onReject,
  onAddToCart,
  onSign,
  isSignLoading,
  isSignDisabled,
  isAddToCartDisplayed,
  isAddToCartDisabled,
  inProgressButtonText
}: Props) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const { userRequests } = useMainControllerState()
  const { account } = useSelectedAccountControllerState()
  const { accountOp } = useSignAccountOpControllerState() || {}
  const chainId = accountOp?.chainId

  const batchCount = useMemo(() => {
    return userRequests.filter((r) => {
      return (
        r.action.kind === 'calls' &&
        r.meta.accountAddr === account?.addr &&
        r.meta.chainId === chainId
      )
    }).length
  }, [account?.addr, userRequests, chainId])

  return (
    <View style={styles.container}>
      <View style={[!isAddToCartDisplayed && flexbox.flex1, flexbox.alignStart]}>
        <Button
          testID="transaction-button-reject"
          type="danger"
          text={t('Reject')}
          onPress={onReject}
          hasBottomSpacing={false}
          size="large"
          disabled={isSignLoading}
          style={{ width: 98 }}
        />
      </View>
      <ActionsPagination />
      <View
        style={[flexbox.directionRow, !isAddToCartDisplayed && flexbox.flex1, flexbox.justifyEnd]}
      >
        {isAddToCartDisplayed && (
          <Button
            testID="queue-and-sign-later-button"
            type="outline"
            accentColor={theme.primary}
            text={
              batchCount > 1
                ? t('Add to batch ({{batchCount}})', {
                    batchCount
                  })
                : t('Start a batch')
            }
            onPress={onAddToCart}
            disabled={isAddToCartDisabled}
            hasBottomSpacing={false}
            style={{ minWidth: 160, ...spacings.ph, ...spacings.mr }}
            size="large"
          >
            <BatchIcon style={spacings.mlTy} />
          </Button>
        )}
        <Button
          testID="transaction-button-sign"
          type="primary"
          disabled={isSignDisabled}
          text={isSignLoading ? inProgressButtonText : t('Sign')}
          onPress={onSign}
          hasBottomSpacing={false}
          style={{ width: 160 }}
          size="large"
        />
      </View>
    </View>
  )
}

export default Footer
