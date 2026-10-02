import React, { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'
import {
  addEventListener,
  removeEventListener,
  restart,
  sync,
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

// How long "Try again" stays disabled while waiting for the retry to show any result.
// sync() returns nothing - the result only comes as an event: the first download progress
// (the retry worked), a download error or a failed check for a new release (it didn't).
// This covers only that first step - Stallion checking for the release and starting the
// bundle download - not the download itself: the first progress clears the timeout, and
// the download then takes as long as it needs.
// The timeout is for retries that end without any event, e.g. when Stallion no longer offers
// the release (paused or rolled back meanwhile), so the button is given back after a while.
const RETRY_TIMEOUT = 10000

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
  const [isRetrying, setIsRetrying] = useState(false)

  const isMandatory = !!newReleaseBundle?.isMandatory

  useEffect(() => {
    // Listens regardless of the flag, because the flag arrives only after the download
    // has started, and a failure in between must not leave the modal waiting forever.
    const onStallionEvent = (event?: { type?: string; progress?: string }) => {
      if (event?.type === 'DOWNLOAD_ERROR_PROD') {
        setHasDownloadFailed(true)
        setIsRetrying(false)
        return
      }

      // A failed check for a new release says nothing about a download that is already
      // running, so it only ends a retry, which starts with such a check
      if (event?.type === 'SYNC_ERROR_PROD') {
        setIsRetrying(false)
        return
      }

      if (event?.type !== 'DOWNLOAD_PROGRESS_PROD') return

      // The native layer sends the progress as a stringified fraction between 0 and 1
      const progress = Number(event.progress)
      if (!Number.isFinite(progress)) return

      setHasDownloadFailed(false)
      setIsRetrying(false)
      setDownloadProgress(progress)
    }

    addEventListener(onStallionEvent)

    return () => removeEventListener(onStallionEvent)
  }, [])

  useEffect(() => {
    if (!isRetrying) return

    const timeout = setTimeout(() => setIsRetrying(false), RETRY_TIMEOUT)

    return () => clearTimeout(timeout)
  }, [isRetrying])

  useEffect(() => {
    if (isMandatory) open()
    else close()
  }, [isMandatory, open, close])

  // Asks Stallion for the release again, which downloads it anew (on Android it picks up
  // where the failed download stopped)
  const handleRetry = useCallback(() => {
    setIsRetrying(true)
    sync()
  }, [])

  if (!isMandatory) return null

  const renderStatus = () => {
    if (isRestartRequired) {
      return (
        <Button
          text={t('Restart to apply update')}
          onPress={restart}
          hasBottomSpacing={false}
          style={spacings.mbLg}
        />
      )
    }

    // The modal stays up after a failed download, so the user retries instead of being
    // left on the outdated version
    if (hasDownloadFailed) {
      return (
        <View style={spacings.mbLg}>
          <Text fontSize={14} appearance="warningText" style={[spacings.mbLg, text.center]}>
            {t("The update couldn't be downloaded. Check your internet connection and try again.")}
          </Text>
          <Button
            text={isRetrying ? t('Trying again...') : t('Try again')}
            onPress={handleRetry}
            disabled={isRetrying}
            hasBottomSpacing={false}
          />
        </View>
      )
    }

    return (
      <View style={spacings.mbLg}>
        <DappProgressBar progress={downloadProgress} style={spacings.mbSm} />
        <Text fontSize={12} appearance="secondaryText" style={text.center}>
          {t('Downloading the update... {{percent}}%', {
            percent: Math.round(downloadProgress * 100)
          })}
        </Text>
      </View>
    )
  }

  return (
    <BottomSheet
      id="mandatory-ota-update-modal"
      sheetRef={ref}
      autoOpen
      shouldBeClosableOnDrag={false}
      // Above any other sheet (nested ones stack 2 apart from the base), so nothing else
      // can be used until the update is applied. Still below the global tooltip.
      customZIndex={BOTTOM_SHEET_Z_INDEX + 9}
    >
      <ModalHeader title={t('Update required')} style={spacings.mbLg} />
      <Text fontSize={14} style={[spacings.mbLg, text.center]}>
        {t('Ambire needs an update to keep working. This update is required and can’t be skipped.')}
      </Text>
      {renderStatus()}
    </BottomSheet>
  )
}

export default React.memo(MandatoryOtaUpdateModal)
