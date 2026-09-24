import React, { useCallback } from 'react'
import { View } from 'react-native'

import BadgeWithPreset from '@common/components/BadgeWithPreset'
import PrivacyPoolsAccountAvatar from '@common/components/PrivacyPoolsAccountAvatar'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import { PrivacyPoolsAccountDisplay } from '@common/hooks/usePrivacyPoolsAccounts'
import useTheme from '@common/hooks/useTheme'
import getAccountStyles from '@common/modules/account-select/components/Account/styles'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectMainStatuses = (state: AllControllersMappingType['MainController']) => state.statuses

type Props = {
  account: PrivacyPoolsAccountDisplay
  isSelected: boolean
  onSelect: (seedId: string) => void
}

/**
 * A Privacy Pools account in the account list - the counterpart of `Account`, with the same
 * height so the two sit in one list.
 *
 * The balance is a dash: it is only known once the account is opened and synced, and a stale or
 * guessed figure next to real ones would be misleading.
 */
const PrivacyPoolsAccountRow = ({ account, isSelected, onSelect }: Props) => {
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getAccountStyles)
  const { state: mainStatuses, dispatch: mainDispatch } = useController(
    'MainController',
    selectMainStatuses
  )
  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: { from: theme.primaryBackground, to: theme.secondaryBackground }
  })

  const handlePress = useCallback(() => {
    if (!isSelected) {
      mainDispatch({
        type: 'method',
        params: { method: 'selectPrivacyPoolsAccount', args: [account.seedId] }
      })
    }

    onSelect(account.seedId)
  }, [account.seedId, isSelected, mainDispatch, onSelect])

  return (
    <AnimatedPressable
      disabled={mainStatuses.selectAccount !== 'INITIAL'}
      onPress={handlePress}
      {...bindAnim}
      testID="privacy-pools-account"
      style={[
        styles.accountContainer,
        animStyle,
        isSelected && { backgroundColor: theme.secondaryBackground }
      ]}
    >
      <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}>
        <PrivacyPoolsAccountAvatar style={spacings.mrTy} />
        <View style={[flexbox.flex1, flexbox.justifyCenter]}>
          <Text fontSize={14} weight="medium" numberOfLines={1} style={spacings.mrTy}>
            {account.label}
          </Text>
          <Text fontSize={12} appearance="secondaryText" numberOfLines={1}>
            {t('Private account, no public address')}
          </Text>
          <View
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              spacings.mtMi,
              { columnGap: SPACING_TY }
            ]}
          >
            <Text fontSize={14} weight="semiBold" color={theme.secondaryText}>
              —
            </Text>
            <BadgeWithPreset preset="privacy-pools" withRightSpacing={false} />
          </View>
        </View>
      </View>
    </AnimatedPressable>
  )
}

export default React.memo(PrivacyPoolsAccountRow)
