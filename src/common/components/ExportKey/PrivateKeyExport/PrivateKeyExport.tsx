import { BlurView } from 'expo-blur'
import React, { FC, useCallback } from 'react'
import { StyleSheet, View } from 'react-native'

import CopyIcon from '@common/assets/svg/CopyIcon'
import InvisibilityIcon from '@common/assets/svg/InvisibilityIcon'
import VisibilityIcon from '@common/assets/svg/VisibilityIcon'
import Alert from '@common/components/Alert'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { setStringAsync } from '@common/utils/clipboard'

import getStyles from './styles'

const DUMMY_PRIVATE_KEY = '0x92f3a1c4e5b6d7089a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f6a7b8'

interface Props {
  privateKey: string | null
  blurred: boolean
  setBlurred: React.Dispatch<React.SetStateAction<boolean>>
  openConfirmPassword: () => void
}

const PrivateKeyExport: FC<Props> = ({ privateKey, blurred, setBlurred, openConfirmPassword }) => {
  const { t } = useTranslation()

  const { theme, styles, themeType } = useTheme(getStyles)
  const { addToast } = useToast()

  const handleCopyText = useCallback(async () => {
    if (!privateKey) return
    try {
      await setStringAsync(privateKey)
    } catch {
      addToast('Error copying to clipboard', { type: 'error' })
    }
    addToast('Private key copied to clipboard!')
  }, [addToast, privateKey])

  const toggleKeyVisibility = useCallback(async () => {
    if (!privateKey) {
      openConfirmPassword()
      return
    }

    setBlurred((prev) => !prev)
  }, [openConfirmPassword, setBlurred, privateKey])

  return (
    <>
      <View style={[flexbox.flex1, isMobile && spacings.mb]}>
        <View
          style={[
            // On web the blur is a CSS `filter`; on native it doesn't apply,
            // so a BlurView overlay is rendered below instead
            isWeb && (blurred ? styles.blurred : styles.notBlurred),
            spacings.pvMd,
            spacings.phMd,
            {
              backgroundColor: theme.secondaryBackground,
              borderRadius: BORDER_RADIUS_PRIMARY,

              overflow: 'hidden'
            }
          ]}
        >
          <Text testID="private-key-value" fontSize={14} color={theme.secondaryText}>
            {blurred ? DUMMY_PRIVATE_KEY : privateKey}
          </Text>
          {isMobile && blurred && (
            <BlurView intensity={18} tint={themeType} style={StyleSheet.absoluteFill} />
          )}
        </View>
        <View
          style={[
            flexbox.directionRow,
            isWeb && flexbox.alignCenter,
            isWeb && flexbox.justifySpaceBetween,
            isWeb ? spacings.mtTy : spacings.mtSm
          ]}
        >
          {((isMobile && privateKey) || isWeb) && (
            <>
              <View style={[isMobile && { flex: 1 }, { opacity: privateKey ? 1 : 0 }]}>
                <Button
                  testID="copy-private-key-button"
                  onPress={handleCopyText}
                  hasBottomSpacing={false}
                  type={isWeb ? 'ghost' : 'outline'}
                  size={isWeb ? 'small' : 'regular'}
                  text={t('Copy key')}
                  // @ts-expect-error react-native-web supports `cursor`, but it's missing from React Native StyleProp<ViewStyle> types
                  style={isWeb && { cursor: !privateKey ? 'default' : 'pointer' }}
                >
                  <CopyIcon style={spacings.mlTy} width={18} color={theme.iconPrimary} />
                </Button>
              </View>
              {isMobile && <View style={{ width: SPACING_SM }} />}
            </>
          )}
          <View style={isMobile && flexbox.flex1}>
            <Button
              testID="reveal-private-key-button"
              onPress={toggleKeyVisibility}
              hasBottomSpacing={false}
              type={isWeb ? 'ghost' : 'outline'}
              size={isWeb ? 'small' : 'regular'}
              text={blurred ? t('Reveal key') : t('Hide key')}
            >
              {blurred ? (
                <VisibilityIcon color={theme.iconPrimary} style={spacings.mlTy} width={18} />
              ) : (
                <InvisibilityIcon color={theme.iconPrimary} style={spacings.mlTy} width={18} />
              )}
            </Button>
          </View>
        </View>
      </View>
      <Alert
        size="sm"
        type="warning"
        title={t(
          'Warning: Never disclose this key. Anyone with your private key can steal any assets held in your account.'
        )}
      />
    </>
  )
}

export default React.memo(PrivateKeyExport)
