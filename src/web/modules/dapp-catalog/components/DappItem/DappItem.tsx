import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { Dapp } from '@ambire-common/interfaces/dapp'
import ManifestFallbackIcon from '@common/assets/svg/ManifestFallbackIcon'
import OpenIcon from '@common/assets/svg/OpenIcon'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import StarIcon from '@common/assets/svg/StarIcon'
import Badge from '@common/components/Badge'
import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import ManifestImage from '@web/components/ManifestImage'
import { openInTab } from '@web/extension-services/background/webapi/tab'
import useBackgroundService from '@web/hooks/useBackgroundService'
import { AnimatedPressable, useCustomHover } from '@web/hooks/useHover'
import ManageDapp from '@web/modules/dapp-catalog/components/ManageDapp'
import { getUiType } from '@web/utils/uiType'

import getStyles from './styles'

const DappItem = (dapp: Dapp) => {
  const { id, url, name, icon, description, isConnected, favorite, blacklisted } = dapp
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const { styles, theme } = useTheme(getStyles)
  const { dispatch } = useBackgroundService()
  const { t } = useTranslation()
  const [hovered, setHovered] = useState(false)

  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: blacklisted ? theme.errorBackground : theme.secondaryBackground,
      to: blacklisted ? theme.errorBackground : theme.tertiaryBackground
    }
  })

  const fallbackIcon = useCallback(() => <ManifestFallbackIcon />, [])

  return (
    <View style={styles.dappItemWrapper}>
      <div
        style={{ display: 'flex', flex: 1 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <AnimatedPressable
          style={[styles.container, animStyle]}
          onPress={() => openInTab({ url })}
          {...bindAnim}
        >
          <View style={[flexbox.directionRow, spacings.mbSm]}>
            <View style={spacings.mrTy}>
              <ManifestImage
                uri={icon || ''}
                size={40}
                fallback={fallbackIcon}
                containerStyle={{ backgroundColor: theme.primaryBackground }}
                iconScale={0.8}
                imageStyle={{ borderRadius: BORDER_RADIUS_PRIMARY }}
              />
            </View>
            <View style={[flexbox.flex1, flexbox.justifySpaceBetween]}>
              <View
                style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifySpaceBetween]}
              >
                <Pressable
                  onPress={() => {
                    dispatch({
                      type: 'DAPP_CONTROLLER_UPDATE_DAPP',
                      params: { id, dapp: { favorite: !favorite } }
                    })
                  }}
                >
                  <StarIcon isFilled={favorite} style={spacings.mrTy} />
                </Pressable>
                {!!blacklisted && <Badge text={t('Blacklisted')} type="error" />}
                {!!hovered && (
                  <Pressable onPress={openBottomSheet as any} style={spacings.mlTy}>
                    {({ hovered: iconHovered }: any) => (
                      <SettingsIcon
                        width={16}
                        height={16}
                        strokeWidth="2"
                        color={iconHovered ? theme.iconSecondary : theme.iconPrimary}
                      />
                    )}
                  </Pressable>
                )}
              </View>
              <Text weight="semiBold" fontSize={14} appearance="primaryText" numberOfLines={1}>
                {name}
              </Text>
            </View>
          </View>

          <Text
            fontSize={12}
            appearance="secondaryText"
            numberOfLines={isConnected ? 2 : 3}
            // @ts-ignore
            dataSet={{ tooltipId: url, tooltipContent: description }}
          >
            {description}
          </Text>
          {!!getUiType().isPopup && <Tooltip id={url} delayShow={900} />}
          <View style={[flexbox.alignEnd, flexbox.directionRow, flexbox.flex1]}>
            {!!isConnected && <Badge text={t('Connected')} type="success" style={spacings.mrTy} />}
            {hovered && (
              <View style={{ marginLeft: 'auto' }}>
                <OpenIcon width={16} height={16} />
              </View>
            )}
          </View>
        </AnimatedPressable>
      </div>
      <ManageDapp
        dapp={dapp}
        isCurrentDapp={false}
        sheetRef={sheetRef}
        openBottomSheet={openBottomSheet}
        closeBottomSheet={closeBottomSheet}
      />
    </View>
  )
}

export default React.memo(DappItem)
