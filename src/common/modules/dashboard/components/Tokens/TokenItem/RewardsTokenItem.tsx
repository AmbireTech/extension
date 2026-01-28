import React, { useMemo } from 'react'

import { TokenResult } from '@ambire-common/libs/portfolio'
import Button, { Props } from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'

import BaseTokenItem from './BaseTokenItem'

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
  actionButtonText,
  description
}: {
  token: TokenResult
  onPress?: () => void
  actionButtonText?: string
  description: string | React.ReactNode
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
      label={
        <Text fontSize={12} weight="regular">
          {typeof description === 'string' ? t('{{description}}', { description }) : description}
        </Text>
      }
      borderRadius={16}
      wrapperTestID="rewards-button"
    />
  )
}

export default React.memo(RewardsTokenItem)
