import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { Dapp } from '@ambire-common/interfaces/dapp'
import ConnectedIcon from '@common/assets/svg/ConnectedIcon'
import SettingsWheelIcon from '@common/assets/svg/SettingsWheelIcon'
import StarIcon from '@common/assets/svg/StarIcon'
import TwitterIcon from '@common/assets/svg/TwitterIcon'
import Badge from '@common/components/Badge'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import ManifestImage from '@web/components/ManifestImage'
import { openInTab } from '@web/extension-services/background/webapi/tab'
import TrustedIcon from '@web/modules/action-requests/screens/DappConnectScreen/components/TrustedIcon'

import ManageApp from '../ManageApp'
import getStyles from './styles'

function formatTVL(tvl: number) {
  let formatted
  if (tvl >= 1_000_000_000) {
    formatted = `${(tvl / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`
  } else if (tvl >= 1_000_000) {
    formatted = `${(tvl / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  } else if (tvl >= 1_000) {
    formatted = `${(tvl / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  } else {
    formatted = tvl.toString()
  }

  return `TVL: $${formatted}`
}

const DappItem = (dapp: Dapp) => {
  const {
    id,
    url,
    name,
    icon,
    description,
    isConnected,
    isFeatured,
    favorite,
    blacklisted,
    tvl,
    twitter
  } = dapp
  const { styles, theme } = useTheme(getStyles)
  const { dispatch: dappsDispatch } = useController('DappsController')
  const { t } = useTranslation()
  const [hovered, setHovered] = useState(false)
  const [isManageAppOpen, setIsManageAppOpen] = useState(false)
  const [isNetworkSelectorOpen, setIsNetworkSelectorOpen] = useState(false)
  const settingsButtonRef = React.useRef<View>(null)

  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: blacklisted === 'BLACKLISTED' ? theme.errorBackground : theme.secondaryBackground,
      to: blacklisted === 'BLACKLISTED' ? theme.errorBackground : theme.tertiaryBackground
    }
  })

  const [bindStarIconAnimation, starIconAnimationStyle] = useCustomHover({
    property: 'scaleX',
    values: { from: 1, to: 1.175 }
  })

  const [bindXIconAnimation, xIconAnimationStyle] = useCustomHover({
    property: 'scaleX',
    values: { from: 1, to: 1.175 }
  })

  const [bindSettingsIconAnimation, settingsIconAnimationStyle] = useCustomHover({
    property: 'scaleX',
    values: { from: 1, to: 1.175 }
  })

  const getInitials = useCallback((fullName: string) => {
    const words = fullName.split(' ').filter((word) => word.length > 0)
    return words.length > 0 ? words[0]?.[0]?.toUpperCase() : ''
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
    <View testID="dapp-wrapper" style={styles.dappItemWrapper}>
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
          <View style={[flexbox.directionRow, !!description && spacings.mbSm]}>
            <View style={spacings.mrTy}>
              {blacklisted === 'VERIFIED' && (
                <View
                  style={{
                    position: 'absolute',
                    right: -4,
                    top: -3,
                    zIndex: 1
                  }}
                  dataSet={createGlobalTooltipDataSet({
                    id,
                    content: t('Verified app'),
                    delayShow: 250,
                    border: `1px solid ${theme.successDecorative as string}`,
                    style: {
                      fontSize: 12,
                      backgroundColor: theme.successBackground as string,
                      padding: SPACING_TY,
                      color: theme.successDecorative as string
                    }
                  })}
                >
                  <TrustedIcon width={20} height={20} />
                </View>
              )}
              <ManifestImage
                uri={icon || ''}
                size={40}
                fallback={fallbackIcon}
                containerStyle={{ backgroundColor: theme.primaryBackground, borderRadius: 8 }}
                iconScale={1}
              />
            </View>
            <View style={[flexbox.flex1]}>
              <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbMi]}>
                <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1]}>
                  <Text
                    weight="semiBold"
                    fontSize={14}
                    appearance="primaryText"
                    numberOfLines={1}
                    style={[text.left, spacings.mrTy, { lineHeight: 20 }]}
                  >
                    {name}
                  </Text>
                  <AnimatedPressable
                    {...bindStarIconAnimation}
                    style={[
                      spacings.mrTy,
                      {
                        transform: [{ scale: starIconAnimationStyle.scaleX as number }]
                      }
                    ]}
                    onPress={() => {
                      dappsDispatch({
                        type: 'method',
                        params: {
                          method: 'updateDapp',
                          args: [id, { favorite: !favorite }]
                        }
                      })
                    }}
                  >
                    <StarIcon
                      width={20}
                      height={20}
                      color={favorite ? theme.warning400 : theme.iconPrimary}
                    />
                  </AnimatedPressable>
                  {!!isConnected && <ConnectedIcon style={spacings.mrTy} width={20} height={20} />}
                  {!!tvl && (
                    <View
                      style={[
                        spacings.phTy,
                        flexbox.alignCenter,
                        flexbox.justifyCenter,
                        {
                          height: 20,
                          borderLeftWidth: 1,
                          borderRightWidth: 1,
                          borderColor: hexToRgba(theme.neutral600, 0.4)
                        }
                      ]}
                    >
                      <Text fontSize={12} weight="semiBold" appearance="secondaryText">
                        {formatTVL(tvl)}
                      </Text>
                    </View>
                  )}
                  {!!twitter && (
                    <AnimatedPressable
                      style={[
                        {
                          transform: [{ scale: xIconAnimationStyle.scaleX as number }]
                        }
                      ]}
                      {...bindXIconAnimation}
                      onPress={() => openInTab({ url: `https://x.com/${twitter}` })}
                    >
                      <TwitterIcon width={20} height={20} />
                    </AnimatedPressable>
                  )}
                  {blacklisted === 'BLACKLISTED' && (
                    <Badge text={t('Blacklisted')} type="error" style={spacings.mrTy} />
                  )}
                </View>
                <View testID="manage-dapp-dropdown" style={{ zIndex: 999 }}>
                  {!!hovered && !!isConnected && (
                    <AnimatedPressable
                      {...bindSettingsIconAnimation}
                      onPress={() => {
                        setIsManageAppOpen((prev) => !prev)
                        setIsNetworkSelectorOpen(false)
                      }}
                      style={[
                        spacings.mlTy,
                        {
                          transform: [{ scale: settingsIconAnimationStyle.scaleX as number }]
                        }
                      ]}
                      ref={settingsButtonRef}
                    >
                      <SettingsWheelIcon
                        width={20}
                        height={20}
                        strokeWidth="1.8"
                        color={theme.iconPrimary}
                      />
                    </AnimatedPressable>
                  )}
                </View>
                {isFeatured && (
                  <Badge
                    text={t('Featured')}
                    textStyle={{
                      color: '#fff'
                    }}
                    style={{
                      ...spacings.mlTy,
                      backgroundColor: theme.primaryAccent200,
                      borderWidth: 0
                    }}
                  />
                )}
              </View>
              <Text
                weight="medium"
                fontSize={10}
                appearance="tertiaryText"
                numberOfLines={1}
                style={[text.left, spacings.mrTy]}
              >
                {id}
              </Text>
            </View>
          </View>

          <Text fontSize={12} appearance="secondaryText" numberOfLines={isConnected ? 2 : 3}>
            {description}
          </Text>
        </AnimatedPressable>
      </div>
      <ManageApp
        isOpen={isManageAppOpen}
        setIsOpen={setIsManageAppOpen}
        dapp={dapp}
        parentRef={settingsButtonRef}
        isNetworkSelectorExpanded={isNetworkSelectorOpen}
        setIsNetworkSelectorExpanded={setIsNetworkSelectorOpen}
      />
    </View>
  )
}

export default React.memo(DappItem)
