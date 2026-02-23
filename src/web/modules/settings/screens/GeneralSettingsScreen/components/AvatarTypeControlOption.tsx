import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'

import AvatarIcon from '@common/assets/svg/AvatarIcon'
import Avatar from '@common/components/Avatar'
import ControlOption from '@common/components/ControlOption'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import useController from '@common/hooks/useController'
import useHover, { AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { AvatarType } from '@web/extension-services/background/controllers/wallet-state'

const AVATAR_TYPES: AvatarType[] = ['blockies', 'jazzicons', 'polycons']

const AvatarOption: FC<{ type: AvatarType }> = ({ type }) => {
  const {
    state: { avatarType },
    dispatch: walletStateDispatch
  } = useController('WalletStateController')
  const {
    state: { account }
  } = useController('SelectedAccountController')
  const { theme } = useTheme()
  const { t } = useTranslation()
  const [bindAnim, animStyle] = useHover({ preset: 'opacityInverted' })

  return (
    <AnimatedPressable
      key={type}
      onPress={() => {
        walletStateDispatch({
          type: 'method',
          params: {
            method: 'setAvatarType',
            args: [type]
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
      title={t('Account icon')}
      description={t(
        'Choose from three unique icon styles to help you identify accounts at a glance.'
      )}
      renderIcon={<AvatarIcon />}
    >
      {AVATAR_TYPES.map((type) => (
        <AvatarOption key={type} type={type} />
      ))}
    </ControlOption>
  )
}

export default React.memo(AvatarTypeControlOption)
