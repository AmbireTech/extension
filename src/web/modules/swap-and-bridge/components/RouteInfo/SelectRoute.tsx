import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable } from 'react-native'

import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  shouldEnableRoutesSelection: boolean
  openRoutesModal: () => void
}

const SelectRoute: FC<Props> = ({ shouldEnableRoutesSelection, openRoutesModal }) => {
  const { theme } = useTheme()
  const { t } = useTranslation()

  return (
    <Pressable
      style={{
        paddingVertical: 2,
        ...spacings.phTy,
        ...flexbox.directionRow,
        ...flexbox.alignCenter,
        opacity: shouldEnableRoutesSelection ? 1 : 0.5
      }}
      onPress={openRoutesModal as any}
      disabled={!shouldEnableRoutesSelection}
    >
      <Text
        fontSize={12}
        weight="medium"
        color={theme.primaryAccent300}
        style={{
          ...spacings.mrTy,
          textDecorationColor: theme.primaryAccent300,
          textDecorationLine: 'underline'
        }}
        testID="select-route"
      >
        {t('Select route')}
      </Text>
      <RightArrowIcon weight="2" width={8} height={16} color={theme.primaryAccent300} />
    </Pressable>
  )
}

export default SelectRoute
