import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'

import AvatarIcon from '@common/assets/svg/AvatarIcon'
import Avatar from '@common/components/Avatar'
import ControlOption from '@common/components/ControlOption'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { AvatarType } from '@web/extension-services/background/controllers/wallet-state'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useHover, { AnimatedPressable } from '@web/hooks/useHover'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import useWalletStateController from '@web/hooks/useWalletStateController'

const AVATAR_TYPES: AvatarType[] = ['blockies', 'jazzicons', 'polycons']

const AvatarOption: FC<{ type: AvatarType }> = ({ type }) => {
  const { avatarType } = useWalletStateController()
  const { account } = useSelectedAccountControllerState()
  const { dispatch } = useBackgroundService()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const [bindAnim, animStyle] = useHover({ preset: 'opacityInverted' })

  return (
    <AnimatedPressable
      key={type}
      onPress={() => {
        dispatch({
          type: 'SET_AVATAR_TYPE',
          params: {
            avatarType: type
          }
        })
      }}
      // @ts-ignore missing type, but the prop is valid
      dataSet={createGlobalTooltipDataSet({
        id: 'avatar-type-option-' + type,
        content: type.slice(0, 1).toUpperCase() + type.slice(1)
      })}
      style={{
        ...spacings.mlTy,
        ...animStyle,
        borderRadius: 20,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderColor: avatarType === type ? theme.primary : 'transparent'
      }}
      {...bindAnim}
    >
      <Avatar
        pfp=""
        address={account?.addr || ''}
        isSmart={false}
        size={36}
        avatarType={type}
        // Ensures that there won't be any visual glitches between the border
        // and the avatar image
        style={{ ...spacings.pr0, transform: [{ scale: 1.05 }] }}
      />
    </AnimatedPressable>
  )
}

const AvatarTypeControlOption = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  return (
    <ControlOption
      title={t('Avatar style')}
      description={t('Choose between Blockies, Jazzicons, or Polycons for your avatars.')}
      renderIcon={<AvatarIcon width={22} height={22} color={theme.primaryText} />}
    >
      {AVATAR_TYPES.map((type) => (
        <AvatarOption key={type} type={type} />
      ))}
    </ControlOption>
  )
}

export default React.memo(AvatarTypeControlOption)
