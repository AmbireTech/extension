import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import ManifestFallbackIcon from '@common/assets/svg/ManifestFallbackIcon'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import StarIcon from '@common/assets/svg/StarIcon'
import Badge from '@common/components/Badge'
import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { iconColors } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import ManifestImage from '@web/components/ManifestImage'
import { Dapp } from '@web/extension-services/background/controllers/dapps'
import { openInTab } from '@web/extension-services/background/webapi/tab'
import useBackgroundService from '@web/hooks/useBackgroundService'
import { AnimatedPressable, useCustomHover } from '@web/hooks/useHover'
import { getUiType } from '@web/utils/uiType'

import getStyles from './styles'

type Props = Dapp & {
  onOpenDappSettings: (dapp: Dapp) => void
}

const DappItem = ({
  id,
  name,
  description,
  icon,
  url,
  favorite,
  isConnected,
  onOpenDappSettings
}: Props) => {
  const { styles, theme } = useTheme(getStyles)
  const { dispatch } = useBackgroundService()
  const { t } = useTranslation()

  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: theme.secondaryBackground,
      to: theme.tertiaryBackground
    }
  })

  const fallbackIcon = useCallback(() => <ManifestFallbackIcon />, [])

  return (
    <View style={styles.dappItemWrapper}>
      <AnimatedPressable
        style={[styles.container, animStyle]}
        onPress={() => openInTab(url)}
        {...bindAnim}
      >
        <View style={[flexbox.directionRow, spacings.mbSm]}>
          <View style={spacings.mrTy}>
            <ManifestImage uri={icon || ''} size={40} fallback={fallbackIcon} />
          </View>
          <View style={[flexbox.flex1, flexbox.justifySpaceBetween]}>
            <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifySpaceBetween]}>
              <Pressable
                onPress={() => {
                  dispatch({
                    type: 'DAPP_CONTROLLER_UPDATE_DAPP',
                    params: { id, name, description, icon, url, favorite: !favorite }
                  })
                }}
                style={flexbox.alignSelfStart}
              >
                <StarIcon isFilled={favorite} />
              </Pressable>
              <Pressable
                onPress={() => {
                  onOpenDappSettings({ id, name, description, icon, url, favorite, isConnected })
                }}
              >
                {({ hovered }: any) => (
                  <SettingsIcon
                    width={16}
                    height={16}
                    strokeWidth="2"
                    color={hovered ? iconColors.secondary : iconColors.primary}
                  />
                )}
              </Pressable>
            </View>
            <Text weight="semiBold" fontSize={14} appearance="primaryText" numberOfLines={1}>
              {name}
            </Text>
          </View>
        </View>

        <Text
          fontSize={12}
          appearance="secondaryText"
          numberOfLines={isConnected ? 2 : 4}
          // @ts-ignore
          dataSet={{
            tooltipId: id,
            tooltipContent: description
          }}
        >
          {description}
        </Text>
        {!!getUiType().isPopup && <Tooltip id={id} delayShow={1050} />}
        {!!isConnected && (
          <View style={[flexbox.alignStart, flexbox.flex1, flexbox.justifyEnd]}>
            <Badge text={t('Connected')} type="success" />
          </View>
        )}
      </AnimatedPressable>
    </View>
  )
}

export default React.memo(DappItem)
