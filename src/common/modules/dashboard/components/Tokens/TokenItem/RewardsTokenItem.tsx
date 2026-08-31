import React, { useMemo } from 'react'

import Button, { Props } from '@common/components/Button'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'

import BaseTokenItem from './BaseTokenItem'

import type { TokenResult } from '@ambire-common/libs/portfolio'
export interface ClaimButtonProps extends Omit<Props, 'type'> {}

const ClaimButton = ({ textStyle, ...rest }: ClaimButtonProps) => {
  const { theme } = useTheme()

  const claimStyles = useMemo(
    () => ({
      container: {
        backgroundColor: `${String(theme.projectedRewards)}10`,
        borderColor: theme.projectedRewards,
        borderWidth: 1
      },
      text: {
        color: theme.projectedRewards
      }
    }),
    [theme]
  )

  return (
    <Button
      {...rest}
      type="secondary"
      style={[claimStyles.container]}
      textStyle={[claimStyles.text, textStyle]}
    />
  )
}

const RewardsTokenItem = ({
  token,
  onPress,
  actionButtonText
}: {
  token: TokenResult
  onPress?: () => void
  actionButtonText?: string
}) => {
  const { t } = useTranslation()

  return (
    <BaseTokenItem
      rewardsStyle
      token={token}
      onPress={onPress}
      decimalRulesType="noDecimal"
      hasBottomSpacing
      extraActions={
        onPress &&
        actionButtonText && (
          <ClaimButton
            size="small"
            hasBottomSpacing={false}
            onPress={onPress}
            text={t('{{actionButtonText}}', { actionButtonText })}
          />
        )
      }
      borderRadius={16}
      wrapperTestID="projected-rewards-asset-button"
    />
  )
}

export default React.memo(RewardsTokenItem)
