import React, { FC, useCallback } from 'react'

import { Account } from '@ambire-common/interfaces/account'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import FatToggle from '@common/components/FatToggle'
import HoverablePressable from '@common/components/HoverablePressable'
import ScrollableWrapper, { WRAPPER_TYPES } from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  accounts: Account[]
  allowedAccounts: string[]
  onToggleAccount: (addr: string) => void
}

const DAppAccountList: FC<Props> = ({ accounts, allowedAccounts, onToggleAccount }) => {
  const { theme } = useTheme()

  const renderItem = useCallback(
    ({ item }: { item: Account }) => (
      <HoverablePressable
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          spacings.pvSm,
          spacings.phSm,
          spacings.mbTy,
          flexbox.flex1,
          {
            backgroundColor: theme.secondaryBackground,
            borderRadius: BORDER_RADIUS_PRIMARY
          }
        ]}
        onPress={() => onToggleAccount(item.addr)}
      >
        <FatToggle
          width={44}
          height={24}
          style={spacings.mrMd}
          isOn={allowedAccounts.includes(item.addr)}
          onToggle={() => onToggleAccount(item.addr)}
        />
        <Text
          weight="medium"
          style={{ ...spacings.mrTy, flexShrink: 1, flexGrow: 0 }}
          numberOfLines={1}
        >
          {item.preferences.label}
        </Text>
        <Text
          fontSize={14}
          appearance="secondaryText"
          weight="mono_regular"
          numberOfLines={1}
          style={{
            flexShrink: 0,
            flexGrow: 1
          }}
        >
          {shortenAddress(item.addr, 23)}
        </Text>
      </HoverablePressable>
    ),
    [theme.secondaryBackground, allowedAccounts, onToggleAccount]
  )

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: 56,
      offset: 56 * index,
      index
    }),
    []
  )

  return (
    <ScrollableWrapper
      type={WRAPPER_TYPES.FLAT_LIST}
      data={accounts}
      style={flexbox.flex1}
      contentContainerStyle={spacings.mb4Xl}
      keyExtractor={(item: Account) => item.addr}
      renderItem={renderItem}
      getItemLayout={getItemLayout}
    />
  )
}

export default React.memo(DAppAccountList)
