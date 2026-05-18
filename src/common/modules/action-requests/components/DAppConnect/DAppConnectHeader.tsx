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
import { isMobile, isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings, { SPACING, SPACING_LG, SPACING_MD, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import ManifestImage from '@web/components/ManifestImage'

import getStyles from './styles'
import TrustedIcon from './TrustedIcon'

type Props = Partial<DappProviderRequest['session']> & {
  responsiveSizeMultiplier?: number
  securityCheck?: BlacklistedStatus
}

const DAppConnectHeader: FC<Props> = ({
  id,
  name = 'Unknown App',
  icon,
  responsiveSizeMultiplier = 1,
  securityCheck
}) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)

  const { minHeightSize } = useWindowSize()

  const spacingsStyle = useMemo(() => {
    return {
      paddingHorizontal: SPACING_LG * responsiveSizeMultiplier,
      paddingTop: isMobile ? SPACING_LG : SPACING_MD * responsiveSizeMultiplier,
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
                : theme.tertiaryBackground
        },
        spacingsStyle
      ]}
    >
      <Text
        weight="medium"
        fontSize={responsiveSizeMultiplier * 20}
        appearance="secondaryText"
        style={[
          {
            marginBottom: SPACING * responsiveSizeMultiplier
          },
          isMobile && text.center
        ]}
      >
        {t('Connection request from')}
      </Text>
      <View style={[isWeb && flexbox.directionRow, flexbox.alignCenter]}>
        <View style={[isWeb && spacings.mr, isMobile && spacings.mbTy]}>
          <ManifestImage
            key={icon}
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
              dataSet={createGlobalTooltipDataSet({
                id: `verified-${id}`,
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
              <TrustedIcon />
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
        <View style={isWeb ? flexbox.flex1 : { flexGrow: 1 }}>
          <Text
            style={[
              isWeb && !minHeightSize('m') && spacings.mbMi,
              isWeb && flexbox.flex1,
              { lineHeight: 23 },
              isMobile && text.center
            ]}
            fontSize={responsiveSizeMultiplier * 20}
            weight="semiBold"
            numberOfLines={2}
          >
            {name}
          </Text>
          <Text
            fontSize={14 * responsiveSizeMultiplier}
            appearance="secondaryText"
            style={isMobile && text.center}
          >
            {id}
          </Text>
        </View>
      </View>
    </View>
  )
}

export default React.memo(DAppConnectHeader)
