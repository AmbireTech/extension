import React, { FC, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { BlacklistedStatus } from '@ambire-common/interfaces/phishing'
import CheckIcon from '@common/assets/svg/CheckIcon'
import ErrorIcon from '@common/assets/svg/ErrorIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Badge from '@common/components/Badge'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING, SPACING_LG, SPACING_MI } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@web/extension-services/background/webapi/tab'

import getStyles from '../styles'
import DAppPermissions from './DAppPermissions'

const DAppConnectBody: FC<{
  responsiveSizeMultiplier: number
  securityCheck: BlacklistedStatus
}> = ({ securityCheck, responsiveSizeMultiplier }) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)

  const spacingsStyle = useMemo(() => {
    return {
      paddingHorizontal: SPACING_LG * responsiveSizeMultiplier,
      paddingTop: SPACING_LG * responsiveSizeMultiplier,
      paddingBottom: SPACING_LG * responsiveSizeMultiplier
    }
  }, [responsiveSizeMultiplier])

  return (
    <View style={[styles.contentBody, spacingsStyle]}>
      <View
        style={[
          styles.securityChecksContainer,
          {
            marginBottom: SPACING * responsiveSizeMultiplier
          },
          securityCheck === 'BLACKLISTED' && { borderColor: theme.errorDecorative },
          securityCheck === 'FAILED_TO_GET' && { borderColor: theme.warningDecorative }
        ]}
      >
        <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifySpaceBetween]}>
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <Text fontSize={14} weight="medium" style={spacings.mr} appearance="secondaryText">
              {t('Security checks')}
            </Text>
          </View>
          {securityCheck === 'LOADING' && <Spinner style={{ width: 18, height: 18 }} />}
          {securityCheck === 'VERIFIED' && (
            <Badge type="success" text={t('Passed')} testId="dapp-security-check-passed">
              <CheckIcon
                width={12}
                height={12}
                style={{ marginRight: -SPACING_MI, marginLeft: SPACING_MI }}
              />
            </Badge>
          )}
          {securityCheck === 'BLACKLISTED' && (
            <Badge type="error" text={t('Danger')}>
              <ErrorIcon
                width={12}
                height={12}
                color={theme.errorDecorative}
                style={{ marginRight: -SPACING_MI, marginLeft: SPACING_MI }}
              />
            </Badge>
          )}
          {securityCheck === 'FAILED_TO_GET' && (
            <Badge type="warning" text={t('Warning')}>
              <WarningIcon
                width={12}
                height={12}
                color={theme.warningDecorative}
                style={{ marginRight: -SPACING_MI, marginLeft: SPACING_MI }}
              />
            </Badge>
          )}
        </View>
        {(securityCheck === 'BLACKLISTED' || securityCheck === 'FAILED_TO_GET') && (
          <View style={spacings.ptTy}>
            <Text
              fontSize={20 * responsiveSizeMultiplier}
              weight="semiBold"
              color={
                securityCheck === 'BLACKLISTED' ? theme.errorDecorative : theme.warningDecorative
              }
              style={[{ lineHeight: 18 * responsiveSizeMultiplier }, spacings.mbTy]}
            >
              {securityCheck === 'BLACKLISTED' ? t('Potential danger!') : t('Warning!')}
            </Text>
            {securityCheck === 'BLACKLISTED' && (
              <Trans>
                <Text
                  fontSize={14 * responsiveSizeMultiplier}
                  color={theme.errorDecorative}
                  style={{ lineHeight: 18 * responsiveSizeMultiplier }}
                >
                  {
                    "This website didn't pass our safety checks. It might trick you into signing malicious transactions or asking you to reveal sensitive information. If you believe we have blocked it in error, please "
                  }
                  <Text
                    fontSize={14 * responsiveSizeMultiplier}
                    color={theme.errorDecorative}
                    style={{ lineHeight: 18 * responsiveSizeMultiplier }}
                    underline
                    onPress={() =>
                      openInTab({ url: 'https://help.ambire.com/hc/en-us/requests/new' })
                    }
                  >
                    let us know.
                  </Text>
                </Text>
              </Trans>
            )}
            {securityCheck === 'FAILED_TO_GET' && (
              <Text
                fontSize={14 * responsiveSizeMultiplier}
                color={theme.warningDecorative}
                style={{ lineHeight: 18 * responsiveSizeMultiplier }}
              >
                {t("We couldn't check this domain for malicious activity. Proceed with caution.")}
              </Text>
            )}
          </View>
        )}
      </View>
      <DAppPermissions responsiveSizeMultiplier={responsiveSizeMultiplier} />
      {!(securityCheck === 'BLACKLISTED' || securityCheck === 'FAILED_TO_GET') && (
        <Text
          style={{
            opacity: 0.64,
            marginHorizontal: 'auto'
          }}
          fontSize={14 * responsiveSizeMultiplier}
          weight="medium"
          appearance="tertiaryText"
        >
          {t('Only connect with sites you trust')}
        </Text>
      )}
    </View>
  )
}

export default React.memo(DAppConnectBody)
