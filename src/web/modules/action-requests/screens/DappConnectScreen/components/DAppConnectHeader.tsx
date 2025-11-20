import React, { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { DappProviderRequest } from '@ambire-common/interfaces/dapp'
import { BlacklistedStatus } from '@ambire-common/interfaces/phishing'
import ErrorFilledIcon from '@common/assets/svg/ErrorFilledIcon'
import ManifestFallbackIcon from '@common/assets/svg/ManifestFallbackIcon'
import WarningFilledIcon from '@common/assets/svg/WarningFilledIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings, { SPACING, SPACING_LG, SPACING_MD, SPACING_TY } from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import ManifestImage from '@web/components/ManifestImage'

import getStyles from '../styles'
import TrustedIcon from './TrustedIcon'

type Props = Partial<DappProviderRequest['session']> & {
  responsiveSizeMultiplier: number
  securityCheck: BlacklistedStatus
}

const DAppConnectHeader: FC<Props> = ({
  id,
  name = 'Unknown App',
  icon,
  responsiveSizeMultiplier,
  securityCheck
}) => {
  const { t } = useTranslation()
  const { styles, theme, themeType } = useTheme(getStyles)

  const { minHeightSize } = useWindowSize()

  const spacingsStyle = useMemo(() => {
    return {
      paddingHorizontal: SPACING_LG * responsiveSizeMultiplier,
      paddingTop: SPACING_MD * responsiveSizeMultiplier,
      paddingBottom: SPACING_LG * responsiveSizeMultiplier
    }
  }, [responsiveSizeMultiplier])

  return (
    <View
      style={[
        styles.contentHeader,
        {
          backgroundColor:
            securityCheck === 'BLACKLISTED'
              ? theme.errorBackground
              : securityCheck === 'FAILED_TO_GET'
              ? theme.warningBackground
              : themeType === THEME_TYPES.DARK
              ? theme.secondaryBackground
              : theme.tertiaryBackground
        },
        spacingsStyle
      ]}
    >
      <Text
        weight="medium"
        fontSize={responsiveSizeMultiplier * 20}
        style={{
          marginBottom: SPACING * responsiveSizeMultiplier
        }}
      >
        {t('Connection request from')}
      </Text>
      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
        <View style={spacings.mr}>
          <ManifestImage
            uri={icon}
            size={responsiveSizeMultiplier * 56}
            fallback={() => (
              <ManifestFallbackIcon
                width={responsiveSizeMultiplier * 56}
                height={responsiveSizeMultiplier * 56}
              />
            )}
          />

          {securityCheck === 'VERIFIED' && (
            <View
              style={{
                position: 'absolute',
                right: -9,
                top: -5
              }}
              // @ts-ignore
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
              <TrustedIcon borderColor={theme.tertiaryBackground} />
            </View>
          )}
          {securityCheck === 'BLACKLISTED' && (
            <View
              style={{
                position: 'absolute',
                right: -9,
                top: -4
              }}
            >
              <ErrorFilledIcon width={18} height={18} />
            </View>
          )}
          {securityCheck === 'FAILED_TO_GET' && (
            <View
              style={{
                position: 'absolute',
                right: -9,
                top: -4
              }}
            >
              <WarningFilledIcon width={18} height={18} />
            </View>
          )}
        </View>
        <View style={flexbox.flex1}>
          <Text
            style={[!minHeightSize('m') && spacings.mbMi, flexbox.flex1, { lineHeight: 23 }]}
            fontSize={responsiveSizeMultiplier * 20}
            weight="semiBold"
            numberOfLines={2}
          >
            {name}
          </Text>
          <Text fontSize={14 * responsiveSizeMultiplier} appearance="secondaryText">
            {id}
          </Text>
        </View>
      </View>
    </View>
  )
}

export default React.memo(DAppConnectHeader)
