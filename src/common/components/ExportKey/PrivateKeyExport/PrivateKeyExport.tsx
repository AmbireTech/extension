import React, { FC, useCallback } from 'react'
import { View } from 'react-native'

import CopyIcon from '@common/assets/svg/CopyIcon'
import InvisibilityIcon from '@common/assets/svg/InvisibilityIcon'
import VisibilityIcon from '@common/assets/svg/VisibilityIcon'
import Alert from '@common/components/Alert'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import { setStringAsync } from '@common/utils/clipboard'

import getStyles from './styles'

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
      <View style={flexbox.flex1}>
        <View
          style={[
            blurred ? styles.blurred : styles.notBlurred,
            spacings.pvMd,
            spacings.phMd,
            {
              backgroundColor:
                themeType === THEME_TYPES.DARK
                  ? theme.tertiaryBackground
                  : theme.secondaryBackground
            }
          ]}
        >
          <Text fontSize={14} color={theme.secondaryText}>
            {privateKey}
          </Text>
        </View>
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            flexbox.justifySpaceBetween,
            spacings.mtTy,
            { marginHorizontal: -SPACING_SM }
          ]}
        >
          <View style={{ opacity: privateKey ? 1 : 0 }}>
            <Button
              onPress={handleCopyText}
              hasBottomSpacing={false}
              type="ghost"
              size="small"
              text={t('Copy key')}
              style={{
                // @ts-ignore
                cursor: !privateKey ? 'default' : 'pointer'
              }}
            >
              <CopyIcon style={spacings.mlTy} width={18} color={theme.iconPrimary} />
            </Button>
          </View>

          <Button
            onPress={toggleKeyVisibility}
            hasBottomSpacing={false}
            type="ghost"
            size="small"
            style={{ minWidth: 137 }}
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
