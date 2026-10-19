import { execSync } from 'child_process'
import { IOS_MOBILE_INVITE_CODE } from 'constants/env'
import selectors from 'constants/selectors'
import { join } from 'path'

import { expect } from '@mobilewright/test'

import type { Device, Screen } from 'mobilewright'

const ANDROID_HOME = process.env.ANDROID_HOME ?? join(process.env.HOME ?? '', 'Library/Android/sdk')
const ADB_BIN = join(ANDROID_HOME, 'platform-tools', 'adb')

/**
 * Wipes the app's local state, relaunches it, and clears the mobile invite gate if it appears.
 * Extracted from auth.spec.ts's original inline `beforeEach` so every other feature spec
 * (add account, gas tank, transfer, swap & bridge) can start from the same clean slate without
 * duplicating the ADB/simctl reset logic.
 */
export async function resetAppToCleanState({
  screen,
  device,
  bundleId,
  projectName
}: {
  screen: Screen
  device: Device
  bundleId: string | undefined
  projectName: string
}): Promise<void> {
  if (!bundleId) throw new Error(`No bundleId configured for project "${projectName}"`)

  if (projectName === 'android') {
    // `pm clear` wipes all app data and force-stops it; relaunch for a clean start.
    execSync(`"${ADB_BIN}" shell pm clear ${bundleId}`)
    await device.launchApp(bundleId)

    // A system dialog can appear right after clearing data — dismiss it if present.
    const systemDialogOkButton = screen.getByTestId('android:id/button1')
    if (await systemDialogOkButton.count()) await systemDialogOkButton.tap()
  }

  if (projectName === 'ios') {
    // mobilewright has no equivalent for clearAppData()/pm-clear, but xcrun simctl does -
    // clearing just the app data container
    await device.terminateApp(bundleId).catch(() => {})
    const dataContainer = execSync(`xcrun simctl get_app_container ${device.id} ${bundleId} data`)
      .toString()
      .trim()
    execSync(`rm -rf "${dataContainer}"`)
    await device.launchApp(bundleId)

    const inviteCodeInput = screen.getByTestId(selectors.invite.codeInput)
    if (await inviteCodeInput.count()) {
      if (!IOS_MOBILE_INVITE_CODE) {
        throw new Error(
          'App is showing the invite gate but MOBILE_INVITE_CODE is not set (see e2e-playwright-tests/constants/env.ts).'
        )
      }

      await inviteCodeInput.fill(IOS_MOBILE_INVITE_CODE)
      await screen.getByTestId(selectors.invite.verifyBtn).tap()
      await expect(inviteCodeInput).not.toBeVisible()
    }
  }
}
