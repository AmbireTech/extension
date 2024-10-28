import { setStringAsync } from 'expo-clipboard'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import CopyIcon from '@common/assets/svg/CopyIcon'
import InvisibilityIcon from '@common/assets/svg/InvisibilityIcon'
import VisibilityIcon from '@common/assets/svg/VisibilityIcon'
import Alert from '@common/components/Alert'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import Checkbox from '@common/components/Checkbox'
import Text from '@common/components/Text'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { delayPromise } from '@common/utils/promises'
import eventBus from '@web/extension-services/event/eventBus'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import PasswordConfirmation from '@web/modules/settings/components/PasswordConfirmation'
import SettingsPageHeader from '@web/modules/settings/components/SettingsPageHeader'

import getStyles from './styles'

const SavedSeedScreen = () => {
  const { dispatch } = useBackgroundService()
  const [passwordConfirmed, setPasswordConfirmed] = useState<boolean>(false)
  const [deleteSeedIsConfirmed, setDeleteSeedIsConfirmed] = useState<boolean>(false)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const keystoreState = useKeystoreControllerState()
  const [seed, setSeed] = useState<string | null>(null)
  const [blurred, setBlurred] = useState<boolean>(true)
  const { ref: sheetRef, open, close } = useModalize()
  const { navigate } = useNavigation()

  const { addToast } = useToast()
  const { theme, styles } = useTheme(getStyles)
  const { t } = useTranslation()

  const onPasswordConfirmed = () => {
    setPasswordConfirmed(true)
    dispatch({
      type: 'KEYSTORE_CONTROLLER_SEND_SEED_OVER_CHANNEL'
    })
  }

  useEffect(() => {
    const onReceiveOneTimeData = (data: any) => {
      if (!data.seed) return

      setSeed(data.seed)
    }

    eventBus.addEventListener('receiveOneTimeData', onReceiveOneTimeData)

    return () => eventBus.removeEventListener('addToast', onReceiveOneTimeData)
  }, [])

  const toggleKeyVisibility = useCallback(async () => {
    setBlurred((prev) => !prev)
  }, [])

  const handleCopyText = useCallback(async () => {
    if (!seed) return
    try {
      await setStringAsync(seed)
    } catch {
      addToast('Error copying to clipboard', { type: 'error' })
    }
    addToast('Copied to clipboard!')
  }, [addToast, seed])

  useEffect(() => {
    if (keystoreState.statuses.deleteSavedSeed === 'SUCCESS') {
      addToast(t('Saved seed deleted successfully'))
      navigate(WEB_ROUTES.securityAndPrivacy)
    }
  }, [keystoreState.statuses.deleteSavedSeed, navigate, addToast, t])

  if (!keystoreState.hasKeystoreSavedSeed) {
    return (
      <Alert
        type="warning"
        style={spacings.mtTy}
        text={t("Currently, you don't have a saved seed in the extension")}
      />
    )
  }

  const deleteSavedSeed = async () => {
    setIsDeleting(true)

    // the below dispatch happens instantaniously, causing actually
    // bad UX
    await delayPromise(600)

    dispatch({
      type: 'KEYSTORE_CONTROLLER_DELETE_SAVED_SEED'
    })
  }

  return (
    <View style={{ maxWidth: 440 }}>
      {!passwordConfirmed && (
        <PasswordConfirmation
          onPasswordConfirmed={onPasswordConfirmed}
          text="Please enter your device password to view your seed"
        />
      )}
      {passwordConfirmed && (
        <>
          <View
            style={[
              { borderBottomWidth: 1, borderColor: theme.primaryBorder },
              spacings.pbLg,
              spacings.mbLg
            ]}
          >
            <SettingsPageHeader title="Saved seed phrase" />
            <View
              style={[
                blurred ? styles.blurred : styles.notBlurred,
                spacings.pvMd,
                spacings.phMd,
                { backgroundColor: theme.secondaryBackground }
              ]}
            >
              <Text fontSize={14} color={theme.secondaryText}>
                {seed}
              </Text>
            </View>
            <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter, spacings.mtSm]}>
              <Pressable
                onPress={handleCopyText}
                style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}
              >
                <Text fontSize={14} color={theme.secondaryText}>
                  {t('Copy your seed')}
                </Text>
                <CopyIcon color={theme.secondaryText} style={spacings.mlTy} />
              </Pressable>
              <Pressable
                onPress={toggleKeyVisibility}
                style={[flexbox.flex1, flexbox.directionRowReverse, flexbox.alignCenter]}
              >
                {blurred ? (
                  <VisibilityIcon color={theme.secondaryText} style={spacings.mlTy} />
                ) : (
                  <InvisibilityIcon color={theme.secondaryText} style={spacings.mlTy} />
                )}
                <Text fontSize={14} color={theme.secondaryText}>
                  {blurred ? t('Reveal seed') : t('Hide seed')}
                </Text>
              </Pressable>
            </View>
            <View style={spacings.mtXl}>
              <Alert
                size="sm"
                type="warning"
                title={t(
                  'Warning: Never reveal your seed. Anyone with access to it can steal any assets held in any accounts derived from it'
                )}
              />
            </View>
          </View>
          <View>
            <Alert
              type="error"
              isTypeLabelHidden
              titleWeight="semiBold"
              title="Remove saved seed"
              text={t(
                'Deleting the saved seed will NOT remove any accounts imported from it. Also, it will allow you to save another one in the extension. However, the seed will no longer be available as a backup here. Make sure you have a copy of it stored in a safe place before deleting it.'
              )}
            />
            <Button type="danger" style={spacings.mtTy} text="Delete" onPress={() => open()} />
          </View>
          <BottomSheet
            id="delete-saved-seed-sheet"
            sheetRef={sheetRef}
            closeBottomSheet={close}
            style={{
              width: 512
            }}
          >
            <Text fontSize={20} style={spacings.mbXl} weight="light">
              {t('Confirm saved seed removal')}
            </Text>
            <Checkbox
              value={deleteSeedIsConfirmed}
              onValueChange={() => setDeleteSeedIsConfirmed(!deleteSeedIsConfirmed)}
              uncheckedBorderColor={theme.secondaryText}
              label={t(
                'I acknowledge the seed will no longer be available as a backup in the extension'
              )}
              labelProps={{
                style: {
                  color: theme.secondaryText,
                  fontSize: 14
                },
                weight: 'medium'
              }}
            />
            <Button
              type="danger"
              style={spacings.mtTy}
              text={isDeleting ? 'Deleting...' : 'Delete'}
              disabled={!deleteSeedIsConfirmed || isDeleting}
              onPress={deleteSavedSeed}
            />
          </BottomSheet>
        </>
      )}
    </View>
  )
}

export default React.memo(SavedSeedScreen)
