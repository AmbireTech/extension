import type { TextInputProps } from 'react-native'

import { isAndroid } from '@common/config/env'

/**
 * Keeps the OS autofill out of a field holding a secret the device must never
 * store, like a private key. `secureTextEntry` alone doesn't do it, Android
 * still offers to save the value to the password manager.
 */
export const NO_AUTOFILL_PROPS: TextInputProps = {
  autoComplete: 'off',
  importantForAutofill: 'no'
}

/**
 * For a secret shown in cleartext, like a recovery phrase. Also stops the
 * keyboard from predicting and learning what is typed. Android only does that
 * for the `visible-password` keyboard, so never use these on a
 * `secureTextEntry` field, it would reveal the secret.
 */
export const NO_KEYBOARD_LEARNING_PROPS: TextInputProps = {
  ...NO_AUTOFILL_PROPS,
  autoCorrect: false,
  spellCheck: false,
  ...(isAndroid ? { keyboardType: 'visible-password' as const } : {})
}

/** Mirrors the minimum length `isValidPassword` enforces. */
const MIN_PASSWORD_LENGTH = 8

/**
 * Points the OS password managers at a create-a-password form, so they offer
 * to generate and fill every field. `passwordRules` keeps the generated
 * password valid for us.
 */
export const NEW_PASSWORD_AUTOFILL_PROPS: TextInputProps = {
  autoComplete: 'new-password',
  passwordRules: `minlength: ${MIN_PASSWORD_LENGTH};`
}

/** The sign-in counterpart of {@link NEW_PASSWORD_AUTOFILL_PROPS}. */
export const CURRENT_PASSWORD_AUTOFILL_PROPS: TextInputProps = {
  autoComplete: 'current-password'
}
