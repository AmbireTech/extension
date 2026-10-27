import { execSync } from 'child_process'
import { MOBILE_INVITE_CODE } from 'constants/env'
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

    // The OS's "Android App Compatibility" 16 KB page-size warning (not an app bug - it's
    // flagging the build's native .so libraries aren't yet 16KB-aligned) is tracked by the
    // system/package manager, not app data, so `pm clear` above doesn't suppress it and it
    // can reappear on a fresh launch. "Don't Show Again" persists the dismissal at the OS
    // level, unlike "OK", so later resets on this same device/emulator stop hitting it too.
    const dontShowAgainButton = screen.getByText('Don’t Show Again').or(screen.getByText("Don't Show Again"))
    if (await dontShowAgainButton.count()) await dontShowAgainButton.tap()
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
  }

  // The invite gate (useMobileInviteGate) is enforced identically on both platforms, with one
  // shared code for both - must run regardless of which branch above just reset the device.
  const inviteCodeInput = screen.getByTestId(selectors.invite.codeInput)
  if (await inviteCodeInput.count()) {
    if (!MOBILE_INVITE_CODE) {
      throw new Error(
        'App is showing the invite gate but MOBILE_INVITE_CODE is not set (see e2e-playwright-tests/constants/env.ts).'
      )
    }

    // The verify tap hits the relayer directly (InviteController#verify). A dropped/slow
    // response - common on Android's virtualized, NAT'd emulator network, rarer on iOS
    // simulators which share the host's real network - leaves the code input on screen with
    // InviteController's UNREACHABLE_MESSAGE ("We could not check your code right now...")
    // rather than rejecting the code itself. Retry the tap a few times before giving up, since
    // this is transient connectivity, not a wrong code.
    const VERIFY_RETRY_ATTEMPTS = 3
    let lastError: unknown
    for (let attempt = 1; attempt <= VERIFY_RETRY_ATTEMPTS; attempt += 1) {
      await inviteCodeInput.fill(MOBILE_INVITE_CODE)
      await screen.getByTestId(selectors.invite.verifyBtn).tap()

      try {
        await expect(inviteCodeInput).not.toBeVisible({ timeout: 10000 })
        lastError = undefined
        break
      } catch (error) {
        lastError = error
      }
    }

    if (lastError) throw lastError
  }
}
