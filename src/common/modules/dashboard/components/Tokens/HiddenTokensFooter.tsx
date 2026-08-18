import React, { useCallback } from 'react'
import { Pressable, View } from 'react-native'

import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  hiddenTokensCount: number
  isNetworkFiltered: boolean
}

const HiddenTokensFooter = ({ hiddenTokensCount, isNetworkFiltered }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { navigate } = useNavigation()

  const goToManageTokens = useCallback(() => navigate(WEB_ROUTES.manageTokens), [navigate])

  return (
    <View style={hiddenTokensCount ? spacings.ptTy : spacings.ptSm}>
      {!!hiddenTokensCount && (
        <Pressable
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            flexbox.justifySpaceBetween,
            spacings.pvMi,
            spacings.phTy,
            spacings.mhTy,
            spacings.mbLg,
            {
              borderRadius: 4,
              backgroundColor: theme.secondaryBackground
            }
          ]}
          onPress={goToManageTokens}
        >
          <Text appearance="secondaryText" fontSize={12}>
            {t('You have {{count}} hidden {{tokensLabel}}', {
              count: hiddenTokensCount,
              tokensLabel: hiddenTokensCount > 1 ? t('tokens') : t('token')
            })}{' '}
            {isNetworkFiltered && t('on this network')}
          </Text>
          <RightArrowIcon height={12} color={theme.secondaryText as string} />
        </Pressable>
      )}
    </View>
  )
}

export default React.memo(HiddenTokensFooter)
