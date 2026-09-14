import React, { FC } from 'react'
import { TextStyle, View } from 'react-native'
import { Modalize } from 'react-native-modalize'

import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings, { SPACING } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { setStringAsync } from '@common/utils/clipboard'

// TODO: no per-account invite code exists yet (no controller/relayer endpoint generates
// one for an already-existing account) - swap this for the real value once that lands.
const PLACEHOLDER_INVITE_CODE = '123456789012'

// The "Invite code" label sits on the border line itself (fieldset/legend style) - an
// absolutely-positioned Text whose background matches the sheet's own, so it masks the
// segment of border behind it instead of actually cutting the line. Only `backgroundColor`
// is theme-dependent, so the rest of the position is hoisted as a static style.
const legendLabelStyle: TextStyle = {
  position: 'absolute',
  top: -9,
  left: SPACING,
  paddingHorizontal: 6
}

type Props = {
  sheetRef: React.RefObject<Modalize>
  closeBottomSheet: () => void
}

const MobileAppInfoBottomSheet: FC<Props> = ({ sheetRef, closeBottomSheet }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { addToast } = useToast()

  const handleCopyInviteCode = () => {
    setStringAsync(PLACEHOLDER_INVITE_CODE).catch((error) => {
      console.error('Failed to copy invite code to clipboard', error)
      captureException(error)
    })
    addToast(t('Copied to clipboard!') as string, { timeout: 2500 })
  }

  return (
    <BottomSheet
      id="mobile-app-info-bottom-sheet"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
    >
      <ModalHeader handleClose={closeBottomSheet} />
      <Text weight="semiBold" fontSize={20} style={[spacings.mbSm, text.center]}>
        {t('Ambire Mobile is live! 🚀')}
      </Text>
      <Text appearance="secondaryText" fontSize={14} style={[spacings.mbTy, text.center]}>
        {t('Our brand-new mobile app is here.')}
      </Text>
      {/* TODO: confirm final marketing copy for this paragraph with product/design */}
      <Text appearance="secondaryText" fontSize={14} style={[spacings.mbLg, text.center]}>
        {t(
          'Use the invite code below to activate your existing Ambire account in the Ambire Mobile app and access your wallet on the go.'
        )}
      </Text>
      <View style={{ position: 'relative', marginTop: 10 }}>
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            flexbox.justifySpaceBetween,
            spacings.phSm,
            spacings.pvSm,
            {
              borderRadius: BORDER_RADIUS_PRIMARY,
              borderWidth: 1,
              // `secondaryBorder` maps to the same neutral300 primitive as `primaryBackground`
              // in both themes, so it's invisible on this (primaryBackground) sheet - use
              // `primaryBorder` (neutral100), which is a genuinely different shade.
              borderColor: theme.primaryBorder
            }
          ]}
        >
          <Text weight="medium" fontSize={18} style={{ letterSpacing: 1 }}>
            {PLACEHOLDER_INVITE_CODE}
          </Text>
          <Button
            text={t('Copy') as string}
            type="tertiary"
            size="small"
            onPress={handleCopyInviteCode}
          />
        </View>
        <Text
          appearance="secondaryText"
          fontSize={12}
          style={[legendLabelStyle, { backgroundColor: theme.primaryBackground }]}
        >
          {t('Invite code')}
        </Text>
      </View>
    </BottomSheet>
  )
}

export default MobileAppInfoBottomSheet
