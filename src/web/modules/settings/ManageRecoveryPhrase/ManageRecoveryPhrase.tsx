import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { HD_PATH_TEMPLATE_TYPE } from '@ambire-common/consts/derivation'
import CopyIcon from '@common/assets/svg/CopyIcon'
import InvisibilityIcon from '@common/assets/svg/InvisibilityIcon'
import VisibilityIcon from '@common/assets/svg/VisibilityIcon'
import Alert from '@common/components/Alert'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import Checkbox from '@common/components/Checkbox'
import Editable from '@common/components/Editable'
import { PanelBackButton, PanelTitle } from '@common/components/Panel/Panel'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { setStringAsync } from '@common/utils/clipboard'
import eventBus from '@web/extension-services/event/eventBus'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import PasswordConfirmation from '@web/modules/settings/components/PasswordConfirmation'

import getStyles from './styles'

const DUMMY_SEED = 'dummy seed phrase canyon pigeon meadow orbit lunch erupt promote silver casino'

const ManageRecoveryPhrase = ({
  recoveryPhrase,
  onBackButtonPress
}: {
  recoveryPhrase: {
    id: string
    label: string
    hdPathTemplate: HD_PATH_TEMPLATE_TYPE
  }
  onBackButtonPress: () => void
}) => {
  const { dispatch } = useBackgroundService()
  const [deleteSeedIsConfirmed, setDeleteSeedIsConfirmed] = useState<boolean>(false)
  const keystoreState = useKeystoreControllerState()
  const [seed, setSeed] = useState<string | null>(DUMMY_SEED)
  const [seedPassphrase, setSeedPassphrase] = useState<string | null>(null)
  const [blurred, setBlurred] = useState<boolean>(true)
  const {
    ref: sheetRefDeleteConfirmation,
    open: openDeleteConfirmation,
    close: closeDeleteConfirmation
  } = useModalize()
  const {
    ref: sheetRefConfirmPassword,
    open: openConfirmPassword,
    close: closeConfirmPassword
  } = useModalize()

  const { addToast } = useToast()
  const { theme, styles, themeType } = useTheme(getStyles)
  const { t } = useTranslation()

  const onPasswordConfirmed = () => {
    dispatch({
      type: 'KEYSTORE_CONTROLLER_SEND_SEED_TO_UI',
      params: { id: recoveryPhrase.id }
    })
    if (blurred) setBlurred(false)
    closeConfirmPassword()
  }

  useEffect(() => {
    const onReceiveOneTimeData = (data: any) => {
      if (!data.seed) return

      setSeed(data.seed)
      setSeedPassphrase(data.seedPassphrase || null)
    }

    eventBus.addEventListener('receiveOneTimeData', onReceiveOneTimeData)

    return () => eventBus.removeEventListener('receiveOneTimeData', onReceiveOneTimeData)
  }, [])

  const toggleKeyVisibility = useCallback(async () => {
    if (!seed || seed === DUMMY_SEED) {
      openConfirmPassword()
      return
    }

    if (!blurred && seed !== DUMMY_SEED) {
      setSeed(DUMMY_SEED)
      setSeedPassphrase(null)
    }

    setBlurred((prev) => !prev)
  }, [seed, blurred, openConfirmPassword])

  const handleCopySeed = useCallback(async () => {
    if (!seed || seed === DUMMY_SEED) return
    try {
      await setStringAsync(seed)
    } catch {
      addToast(t('Error copying to clipboard'), { type: 'error' })
    }
    addToast(t('Recovery phrase copied to clipboard!'))
  }, [addToast, seed, t])

  useEffect(() => {
    if (keystoreState.statuses.deleteSeed === 'SUCCESS') {
      addToast(t('Recovery phrase deleted successfully'))
      !!onBackButtonPress && onBackButtonPress()
    }
  }, [keystoreState.statuses.deleteSeed, onBackButtonPress, addToast, t])

  const deleteSavedSeed = async () => {
    if (!deleteSeedIsConfirmed) return
    dispatch({ type: 'KEYSTORE_CONTROLLER_DELETE_SEED', params: { id: recoveryPhrase.id } })
  }

  const onSave = useCallback(
    (value: string) => {
      dispatch({
        type: 'KEYSTORE_CONTROLLER_UPDATE_SEED',
        params: { id: recoveryPhrase.id, label: value }
      })
      addToast(t('Recovery phrase label updated.'))
    },
    [addToast, dispatch, recoveryPhrase.id, t]
  )

  return (
    <>
      <View style={flexbox.flex1}>
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbLg]}>
          <PanelBackButton onPress={onBackButtonPress} style={spacings.mrSm} />
          <PanelTitle title={t('Manage recovery phrase')} style={text.left} />
        </View>
        <View style={spacings.mb}>
          <Editable
            initialValue={recoveryPhrase.label}
            onSave={onSave}
            fontSize={16}
            height={24}
            textProps={{
              weight: 'medium'
            }}
            minWidth={100}
            maxLength={40}
          />
        </View>
        <View
          style={[
            !blurred && seed !== DUMMY_SEED ? styles.notBlurred : styles.blurred,
            spacings.pvMd,
            spacings.phMd,
            {
              backgroundColor:
                themeType === THEME_TYPES.DARK
                  ? theme.tertiaryBackground
                  : theme.secondaryBackground,
              borderRadius: BORDER_RADIUS_PRIMARY
            }
          ]}
        >
          <Text fontSize={14} color={theme.secondaryText}>
            {seed}
          </Text>
          {!!seedPassphrase && (
            <View style={spacings.ptSm}>
              <Text fontSize={14} color={theme.secondaryText}>
                {t('Passphrase: ')}
                <Text fontSize={14} color={theme.secondaryText} weight="medium">
                  {seedPassphrase}
                </Text>
              </Text>
            </View>
          )}
        </View>
        <View
          style={[
            flexbox.flex1,
            flexbox.directionRow,
            flexbox.justifySpaceBetween,
            spacings.mtTy,
            { marginHorizontal: -SPACING_SM }
          ]}
        >
          <View
            style={{
              opacity: !seed || seed === DUMMY_SEED ? 0 : 1
            }}
          >
            <Button
              onPress={handleCopySeed}
              hasBottomSpacing={false}
              type="ghost"
              size="small"
              text={t('Copy phrase')}
              style={{
                // @ts-ignore
                cursor: !seed || seed === DUMMY_SEED ? 'default' : 'pointer'
              }}
            >
              <CopyIcon style={spacings.mlTy} width={18} />
            </Button>
          </View>
          <Button
            onPress={toggleKeyVisibility}
            hasBottomSpacing={false}
            type="ghost"
            size="small"
            style={{ minWidth: 137 }}
            text={blurred ? t('Reveal phrase') : t('Hide phrase')}
          >
            {blurred ? (
              <VisibilityIcon style={spacings.mlTy} width={18} />
            ) : (
              <InvisibilityIcon style={spacings.mlTy} width={18} />
            )}
          </Button>
        </View>
        <View style={[flexbox.flex1, flexbox.justifyEnd, flexbox.alignCenter]}>
          <Button
            type="danger"
            style={spacings.mtTy}
            text="Remove recovery phrase"
            onPress={openDeleteConfirmation as any}
            hasBottomSpacing={false}
          />
        </View>
      </View>

      <BottomSheet
        id="delete-saved-seed-sheet"
        type="modal"
        sheetRef={sheetRefDeleteConfirmation}
        backgroundColor={
          themeType === THEME_TYPES.DARK ? 'secondaryBackground' : 'primaryBackground'
        }
        closeBottomSheet={closeDeleteConfirmation}
        scrollViewProps={{ contentContainerStyle: { flex: 1 } }}
        containerInnerWrapperStyles={{ flex: 1 }}
        style={{ maxWidth: 432, minHeight: 432, ...spacings.pvLg }}
      >
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbLg]}>
          <PanelBackButton onPress={closeDeleteConfirmation} style={spacings.mrSm} />
          <PanelTitle title={t('Confirm phrase removal')} style={text.left} />
        </View>
        <View style={[flexbox.flex1, flexbox.justifyEnd]}>
          <Alert
            type="warning"
            isTypeLabelHidden
            titleWeight="semiBold"
            size="md"
            text={t('Deleting the recovery phrase will not remove any accounts imported from it.')}
            style={spacings.mbLg}
          />
          <Checkbox
            value={deleteSeedIsConfirmed}
            onValueChange={() => setDeleteSeedIsConfirmed(!deleteSeedIsConfirmed)}
            uncheckedBorderColor={theme.secondaryText}
            label={t(
              `I acknowledge ${recoveryPhrase.label} will no longer be available as a backup in the extension`
            )}
            labelProps={{
              style: { color: theme.secondaryText, fontSize: 14 },
              weight: 'medium'
            }}
          />
          <View style={flexbox.alignCenter}>
            <Button
              type="danger"
              style={spacings.mtTy}
              text={t('Remove recovery phrase')}
              disabled={!deleteSeedIsConfirmed}
              onPress={deleteSavedSeed}
            />
          </View>
        </View>
      </BottomSheet>
      <BottomSheet
        sheetRef={sheetRefConfirmPassword}
        id="confirm-password-bottom-sheet"
        type="modal"
        backgroundColor={
          themeType === THEME_TYPES.DARK ? 'secondaryBackground' : 'primaryBackground'
        }
        closeBottomSheet={closeConfirmPassword}
        scrollViewProps={{ contentContainerStyle: { flex: 1 } }}
        containerInnerWrapperStyles={{ flex: 1 }}
        style={{ maxWidth: 432, minHeight: 432, ...spacings.pvLg }}
      >
        <PasswordConfirmation
          text={t('Please enter your extension password to reveal your recovery phrase.')}
          onPasswordConfirmed={onPasswordConfirmed}
          onBackButtonPress={closeConfirmPassword}
        />
      </BottomSheet>
    </>
  )
}

export default React.memo(ManageRecoveryPhrase)
