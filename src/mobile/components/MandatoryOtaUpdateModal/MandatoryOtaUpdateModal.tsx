import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'
import {
  addEventListener,
  removeEventListener,
  restart,
  useStallionUpdate
} from 'react-native-stallion'

import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import { BOTTOM_SHEET_Z_INDEX } from '@common/components/BottomSheet/styles'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'
import text from '@common/styles/utils/text'
import DappProgressBar from '@mobile/modules/webview/components/DappProgressBar'

/**
 * Takes over the app while an OTA update marked as required in the Stallion console
 * downloads, then has the user restart into it. Every other update keeps going through
 * the dashboard banner (see useOtaUpdateBanner), which shows up only on the dashboard.
 *
 * Mounted globally, so it shows up wherever the user is - also without any accounts,
 * on the unlock screen or behind the invite gate.
 *
 * Stallion's native layer downloads every release the same way, required or not - the
 * flag only reaches JS through `newReleaseBundle`, which the SDK fetches once the
 * download has started.
 */
const MandatoryOtaUpdateModal = () => {
  const { t } = useTranslation()
  const { ref, open, close } = useModalize()
  const { newReleaseBundle, isRestartRequired } = useStallionUpdate()
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [hasDownloadFailed, setHasDownloadFailed] = useState(false)

  const isMandatory = !!newReleaseBundle?.isMandatory
  // A failed download must not lock the user out of the app. Stallion retries it the next
  // time the app comes to the foreground, and its first progress brings the modal back.
  const isVisible = isMandatory && (isRestartRequired || !hasDownloadFailed)

  useEffect(() => {
    // Listens regardless of the flag, because the flag arrives only after the download
    // has started, and a failure in between must not leave the modal waiting forever.
    const onStallionEvent = (event?: { type?: string; progress?: string }) => {
      if (event?.type === 'DOWNLOAD_ERROR_PROD') {
        setHasDownloadFailed(true)
        return
      }

      if (event?.type !== 'DOWNLOAD_PROGRESS_PROD') return

      // The native layer sends the progress as a stringified fraction between 0 and 1
      const progress = Number(event.progress)
      if (!Number.isFinite(progress)) return

      setHasDownloadFailed(false)
      setDownloadProgress(progress)
    }

    addEventListener(onStallionEvent)

    return () => removeEventListener(onStallionEvent)
  }, [])

  useEffect(() => {
    if (isVisible) open()
    else close()
  }, [isVisible, open, close])

  if (!isMandatory) return null

  return (
    <BottomSheet
      id="mandatory-ota-update-modal"
      sheetRef={ref}
      autoOpen={isVisible}
      shouldBeClosableOnDrag={false}
      // Above any other sheet (nested ones stack 2 apart from the base), so nothing else
      // can be used until the update is applied. Still below the global tooltip.
      customZIndex={BOTTOM_SHEET_Z_INDEX + 9}
    >
      <ModalHeader title={t('Update required')} style={spacings.mbLg} />
      <Text fontSize={14} style={[spacings.mbLg, text.center]}>
        {t('Ambire needs an update to keep working. This update is required and can’t be skipped.')}
      </Text>
      {isRestartRequired ? (
        <Button
          text={t('Restart to apply update')}
          onPress={restart}
          hasBottomSpacing={false}
          style={spacings.mbLg}
        />
      ) : (
        <View style={spacings.mbLg}>
          <DappProgressBar progress={downloadProgress} style={spacings.mbSm} />
          <Text fontSize={12} appearance="secondaryText" style={text.center}>
            {t('Downloading the update... {{percent}}%', {
              percent: Math.round(downloadProgress * 100)
            })}
          </Text>
        </View>
      )}
    </BottomSheet>
  )
}

export default React.memo(MandatoryOtaUpdateModal)
