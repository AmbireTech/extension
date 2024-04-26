import React, { FC, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import CheckIcon from '@common/assets/svg/CheckIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { AUTO_LOCK_TIMES } from '@web/extension-services/background/controllers/auto-lock'
import useAutoLockStateController from '@web/hooks/useAutoLockStateController'
import useBackgroundService from '@web/hooks/useBackgroundService'
import { AnimatedPressable, useCustomHover } from '@web/hooks/useHover'

type Props = {
  time: AUTO_LOCK_TIMES
}

const AutoLockOption: FC<Props> = ({ time }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { dispatch } = useBackgroundService()
  const { autoLockTime } = useAutoLockStateController()
  const { addToast } = useToast()
  const isSelected = useMemo(() => autoLockTime === time, [autoLockTime, time])

  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: theme.secondaryBackground,
      to: theme.tertiaryBackground
    },
    forceHoveredStyle: isSelected
  })

  const getAutoLockLabel = useCallback(() => {
    if (time === AUTO_LOCK_TIMES._7days) return t('7 days')
    if (time === AUTO_LOCK_TIMES._1day) return t('1 day')
    if (time === AUTO_LOCK_TIMES._4hours) return t('4 hours')
    if (time === AUTO_LOCK_TIMES._1hour) return t('1 hour')
    if (time === AUTO_LOCK_TIMES._10minutes) return t('10 minutes')

    return t('Never')
  }, [t, time])

  return (
    <AnimatedPressable
      onPress={() => {
        dispatch({ type: 'AUTO_LOCK_CONTROLLER_SET_AUTO_LOCK_TIME', params: time })
        addToast(t(`Auto lock time updated to ${getAutoLockLabel()}.`))
      }}
      disabled={!!isSelected}
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        spacings.phSm,
        spacings.mbSm,
        {
          borderRadius: BORDER_RADIUS_PRIMARY,
          height: 50,
          borderWidth: 1,
          borderColor: theme.secondaryBorder
        },
        animStyle
      ]}
      {...bindAnim}
    >
      <Text fontSize={16} weight="medium" numberOfLines={1} style={[flexbox.flex1, spacings.mrSm]}>
        {getAutoLockLabel()}
      </Text>
      {!!isSelected && <CheckIcon />}
    </AnimatedPressable>
  )
}

export default React.memo(AutoLockOption)
