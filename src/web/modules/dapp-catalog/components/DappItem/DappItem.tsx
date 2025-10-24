import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { Dapp } from '@ambire-common/interfaces/dapp'
import ConnectedIcon from '@common/assets/svg/ConnectedIcon'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import StarIcon from '@common/assets/svg/StarIcon'
import Badge from '@common/components/Badge'
import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import ManifestImage from '@web/components/ManifestImage'
import { openInTab } from '@web/extension-services/background/webapi/tab'
import useBackgroundService from '@web/hooks/useBackgroundService'
import { AnimatedPressable, useCustomHover } from '@web/hooks/useHover'
import TrustedIcon from '@web/modules/action-requests/screens/DappConnectScreen/components/TrustedIcon'
import ManageDapp from '@web/modules/dapp-catalog/components/ManageDapp'
import { getUiType } from '@web/utils/uiType'

import getStyles from './styles'

const DappItem = (dapp: Dapp) => {
  const { id, url, name, icon, description, isConnected, favorite, blacklisted, isCustom } = dapp
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

  const getInitials = useCallback((fullName: string) => {
    const words = fullName.split(' ').filter((word) => word.length > 0)
    return words.length > 0 ? words[0][0].toUpperCase() : ''
  }, [])

  const fallbackIcon = useCallback(
    () => (
      <View style={styles.fallbackWrapper}>
        <Text color={theme.infoText}>{getInitials(name)}</Text>
      </View>
    ),
    [name, getInitials, styles.fallbackWrapper, theme.infoText]
  )

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
          <View style={[flexbox.directionRow, spacings.mbTy]}>
            <View style={spacings.mrTy}>
              {!isCustom && !blacklisted && (
                <View
                  style={{
                    position: 'absolute',
                    right: -4,
                    top: -3,
                    zIndex: 1
                  }}
                >
                  <TrustedIcon width={16} height={16} />
                </View>
              )}
              <ManifestImage
                uri={icon || ''}
                size={40}
                fallback={fallbackIcon}
                containerStyle={{ backgroundColor: theme.primaryBackground }}
                iconScale={0.8}
                imageStyle={{ borderRadius: BORDER_RADIUS_PRIMARY }}
              />
            </View>
            <View style={[flexbox.flex1]}>
              <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1]}>
                  <Text
                    weight="semiBold"
                    fontSize={14}
                    appearance="primaryText"
                    numberOfLines={1}
                    style={[text.left, spacings.mrTy]}
                  >
                    {name}
                  </Text>
                  <Pressable
                    onPress={() => {
                      dispatch({
                        type: 'DAPP_CONTROLLER_UPDATE_DAPP',
                        params: { id, dapp: { favorite: !favorite } }
                      })
                    }}
                    style={spacings.mrTy}
                  >
                    <StarIcon isFilled={favorite} />
                  </Pressable>
                  {!!isConnected && <ConnectedIcon style={spacings.mrTy} />}
                  {!!blacklisted && (
                    <Badge text={t('Blacklisted')} type="error" style={spacings.mrTy} />
                  )}
                </View>
                {!!hovered && (
                  <Pressable onPress={openBottomSheet as any} style={spacings.mlTy}>
                    {({ hovered: iconHovered }: any) => (
                      <SettingsIcon
                        width={18}
                        height={18}
                        strokeWidth="1.8"
                        color={iconHovered ? theme.iconSecondary : theme.iconPrimary}
                      />
                    )}
                  </Pressable>
                )}
              </View>
              <Text
                weight="medium"
                fontSize={11}
                appearance="secondaryText"
                numberOfLines={1}
                style={[text.left, spacings.mrTy]}
              >
                {id}
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
