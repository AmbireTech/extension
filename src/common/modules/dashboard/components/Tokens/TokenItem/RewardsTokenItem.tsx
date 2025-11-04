import React from 'react'

import { TokenResult } from '@ambire-common/libs/portfolio'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'

import BaseTokenItem from './BaseTokenItem'

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
      onPress={onPress && onPress}
      decimalRulesType="noDecimal"
      hasBottomSpacing
      extraActions={
        onPress &&
        actionButtonText && (
          <Button
            size="small"
            type="claimRewards"
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
