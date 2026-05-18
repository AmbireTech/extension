import React, { FC, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { Account } from '@ambire-common/interfaces/account'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import FatToggle from '@common/components/FatToggle'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import HoverablePressable from '@common/components/HoverablePressable'
import ScrollableWrapper, { WRAPPER_TYPES } from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  accounts: Account[]
  allowedAccounts: string[]
  onToggleAccount: (addr: string) => void
  enforce?: 'selected' | 'atLeastOne'
}

const DAppAccountList: FC<Props> = ({ accounts, allowedAccounts, onToggleAccount, enforce }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { account } = useController('SelectedAccountController').state

  const getIsDisabled = useCallback(
    (addr: string) => {
      if (enforce === 'selected') {
        return addr === account?.addr
      }

      const isSelected = allowedAccounts.includes(addr)

      // Don't allow the user to remove the last allowed account, as at least one account must be allowed
      return isSelected && allowedAccounts.length === 1 && allowedAccounts[0] === addr
    },
    [account?.addr, allowedAccounts, enforce]
  )

  return (
    <ScrollableWrapper
      type={WRAPPER_TYPES.FLAT_LIST}
      data={accounts}
      style={flexbox.flex1}
      contentContainerStyle={spacings.mb4Xl}
      keyExtractor={(item: Account) => item.addr}
      renderItem={({ item }: { item: Account }) => (
        <HoverablePressable
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            spacings.pvSm,
            spacings.phSm,
            spacings.mbTy,
            {
              backgroundColor: theme.secondaryBackground,
              borderRadius: BORDER_RADIUS_PRIMARY
            }
          ]}
          disabled={getIsDisabled(item.addr)}
          onPress={() => onToggleAccount(item.addr)}
          dataSet={
            getIsDisabled(item.addr)
              ? createGlobalTooltipDataSet({
                  id: `account-${item.addr}`,
                  content:
                    enforce === 'selected'
                      ? t('Selected account cannot be removed from the list.')
                      : t('Cannot remove all accounts. At least one account must be allowed.')
                })
              : undefined
          }
        >
          <FatToggle
            width={44}
            height={24}
            style={spacings.mrMd}
            isOn={allowedAccounts.includes(item.addr)}
            onToggle={() => onToggleAccount(item.addr)}
            disabled={getIsDisabled(item.addr)}
          />
          <Text weight="medium" style={spacings.mrTy}>
            {item.preferences.label}
          </Text>
          <Text fontSize={14} appearance="secondaryText" weight="mono_regular">
            {shortenAddress(item.addr)}
          </Text>
        </HoverablePressable>
      )}
    />
  )
}

export default React.memo(DAppAccountList)
