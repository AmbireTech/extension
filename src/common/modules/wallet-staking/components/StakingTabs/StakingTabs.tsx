import React, { useCallback } from 'react'
import { View } from 'react-native'

import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import { AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'

import getStyles from './styles'

import type { WalletStakingMode } from '@common/modules/wallet-staking/constants/staking'

interface TabProps {
  mode: WalletStakingMode
  activeMode: WalletStakingMode
  label: string
  onSelect: (mode: WalletStakingMode) => void
}

const StakingTab = ({ mode, activeMode, label, onSelect }: TabProps) => {
  const { styles } = useTheme(getStyles)
  const handlePress = useCallback(() => onSelect(mode), [mode, onSelect])
  const isActive = mode === activeMode

  return (
    <AnimatedPressable onPress={handlePress} style={[styles.tab, isActive && styles.activeTab]}>
      <Text fontSize={16} weight="medium" appearance={isActive ? 'primaryText' : 'tertiaryText'}>
        {label}
      </Text>
    </AnimatedPressable>
  )
}

const MemoizedStakingTab = React.memo(StakingTab)

interface Props {
  mode: WalletStakingMode
  onSelect: (mode: WalletStakingMode) => void
}

const StakingTabs = ({ mode, onSelect }: Props) => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)

  return (
    <View style={styles.tabs}>
      <MemoizedStakingTab mode="stake" activeMode={mode} label={t('Stake')} onSelect={onSelect} />
      <MemoizedStakingTab
        mode="unstake"
        activeMode={mode}
        label={t('Unstake')}
        onSelect={onSelect}
      />
    </View>
  )
}

export default React.memo(StakingTabs)
