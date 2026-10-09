import React, { useMemo } from 'react'

import { Account } from '@ambire-common/interfaces/account'
import SafeIcon, { SAFE_ICON_INLINE_SCALE } from '@common/assets/svg/SafeIcon'
import Badge from '@common/components/Badge'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import { SPACING_MI, SPACING_TY } from '@common/styles/spacings'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const ICON_SIZE = 12

const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts

interface Props {
  account: Account
}

/**
 * Tells the user which of their Safe accounts the account can sign for. A Safe's signers
 * are accounts of their own, so they are synced to the other device only when picked.
 */
const SafeSignerBadges = ({ account }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { state: accounts } = useController('AccountsController', selectAccounts)

  const safesSignedFor = useMemo(
    () =>
      accounts.filter((safe) => !!safe.safeCreation && safe.associatedKeys.includes(account.addr)),
    [account.addr, accounts]
  )

  return (
    <>
      {safesSignedFor.map((safe) => (
        <Badge
          key={safe.addr}
          style={{
            columnGap: SPACING_MI,
            // The badge leaves room only for a trailing info icon when it has children
            paddingRight: SPACING_TY,
            maxWidth: '100%',
            borderWidth: 1,
            borderColor: theme.neutral600
          }}
        >
          <Text fontSize={12} weight="medium" color={theme.neutral600}>
            {t('Signer of')}
          </Text>
          <SafeIcon
            width={ICON_SIZE * SAFE_ICON_INLINE_SCALE}
            height={ICON_SIZE * SAFE_ICON_INLINE_SCALE}
          />
          <Text
            fontSize={12}
            weight="medium"
            color={theme.neutral600}
            numberOfLines={1}
            style={{ flexShrink: 1 }}
          >
            {safe.preferences.label}
          </Text>
        </Badge>
      ))}
    </>
  )
}

export default React.memo(SafeSignerBadges)
