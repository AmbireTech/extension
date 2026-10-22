import React, { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { DappWebsiteContentUpdate } from '@ambire-common/interfaces/dapp'
import { getTimeAgo } from '@ambire-common/services/validations/validate'
import InfoIcon from '@common/assets/svg/InfoIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING, SPACING_MI } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

/**
 * A website replaced within this period gets a warning - an app the user trusted may no longer
 * be the same app.
 */
export const RECENT_WEBSITE_CONTENT_UPDATE_IN_MS = 30 * 24 * 60 * 60 * 1000

const isWithinRecentUpdatePeriod = (updatedAt: number) =>
  Date.now() - updatedAt < RECENT_WEBSITE_CONTENT_UPDATE_IN_MS

const DAppWebsiteContentUpdate: FC<{
  id: string
  websiteContentUpdate: DappWebsiteContentUpdate
  responsiveSizeMultiplier?: number
}> = ({ id, websiteContentUpdate, responsiveSizeMultiplier = 1 }) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)

  const updatedAt = websiteContentUpdate.status === 'LOADED' ? websiteContentUpdate.updatedAt : null
  // Computed once per update time - the connect screen is short-lived, so the text and the
  // warning can't get noticeably stale while it's open
  const { updatedAtText, isRecentlyUpdated } = useMemo(() => {
    if (updatedAt === null) return { updatedAtText: null, isRecentlyUpdated: false }

    const updatedAtDate = new Date(updatedAt)
    return {
      updatedAtText: t('{{timeAgo}} ({{date}})', {
        timeAgo: getTimeAgo(updatedAtDate),
        date: updatedAtDate.toLocaleDateString()
      }),
      isRecentlyUpdated: isWithinRecentUpdatePeriod(updatedAt)
    }
  }, [updatedAt, t])

  return (
    <View
      style={[
        styles.securityChecksContainer,
        { marginBottom: SPACING * responsiveSizeMultiplier },
        isRecentlyUpdated && { borderColor: theme.warningDecorative }
      ]}
      testID="dapp-website-content-update"
    >
      <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifySpaceBetween]}>
        <View
          style={[flexbox.directionRow, flexbox.alignCenter, spacings.mr]}
          dataSet={createGlobalTooltipDataSet({
            id: `website-content-update-${id}`,
            content: t(
              "The owner of this app's name can replace its whole website at any time. A recent change on an app you trust can be a warning sign."
            )
          })}
        >
          <Text fontSize={14} weight="medium" appearance="secondaryText">
            {t('Website last changed')}
          </Text>
          <InfoIcon
            width={14}
            height={14}
            color={theme.secondaryText}
            style={{ marginLeft: SPACING_MI }}
          />
        </View>
        {websiteContentUpdate.status === 'LOADING' && <Spinner style={{ width: 18, height: 18 }} />}
        {websiteContentUpdate.status === 'FAILED' && (
          <Text fontSize={14} appearance="secondaryText">
            {t("Couldn't check")}
          </Text>
        )}
        {!!updatedAtText && (
          <Text
            fontSize={14}
            weight={isRecentlyUpdated ? 'semiBold' : 'regular'}
            color={isRecentlyUpdated ? theme.warningDecorative : theme.primaryText}
          >
            {updatedAtText}
          </Text>
        )}
      </View>
      {isRecentlyUpdated && (
        <Text
          fontSize={12 * responsiveSizeMultiplier}
          color={theme.warningDecorative}
          style={[spacings.ptTy, { lineHeight: 18 * responsiveSizeMultiplier }]}
        >
          {t(
            "This app's website was replaced recently. If you've used it before, make sure it still looks and works the way you expect before connecting."
          )}
        </Text>
      )}
    </View>
  )
}

export default React.memo(DAppWebsiteContentUpdate)
