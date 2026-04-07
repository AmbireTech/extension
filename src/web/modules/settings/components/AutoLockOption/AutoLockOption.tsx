import React, { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import CheckIcon from '@common/assets/svg/CheckIcon'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import {
  AUTO_LOCK_TIMES,
  getAutoLockLabel
} from '@web/extension-services/background/controllers/auto-lock'

type Props = {
  time: AUTO_LOCK_TIMES
}

const AutoLockOption: FC<Props> = ({ time }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const {
    state: { autoLockTime },
    dispatch: autoLockDispatch
  } = useController('AutoLockController')
  const { addToast } = useToast()
  const isSelected = useMemo(() => autoLockTime === time, [autoLockTime, time])

  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: theme.secondaryBackground,
      to: theme.tertiaryBackground
    }
  })

  return (
    <AnimatedPressable
      onPress={() => {
        autoLockDispatch({
          type: 'method',
          params: {
            method: 'setAutoLockTime',
            args: [time]
          }
        })
        addToast(t(`Auto lock time updated to ${getAutoLockLabel(time)}.`))
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
        animStyle,
        isSelected && {
          backgroundColor: theme.tertiaryBackground
        }
      ]}
      {...bindAnim}
    >
      <Text fontSize={16} weight="medium" numberOfLines={1} style={[flexbox.flex1, spacings.mrSm]}>
        {getAutoLockLabel(time)}
      </Text>
      {!!isSelected && <CheckIcon />}
    </AnimatedPressable>
  )
}

export default React.memo(AutoLockOption)
