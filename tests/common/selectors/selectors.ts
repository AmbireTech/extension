import { buildSelector } from '../../common-helpers/buildSelector'

export const TEST_IDS = {
  account: 'account',
  importBtn: 'import-button',
  importPrivateBtn: 'button-import-private-key',
  saveAndContinueBtn: 'button-save-and-continue',
  enterSeedPhraseField: 'enter-seed-phrase-field',
  buttonProceedSeedPhrase: 'button-proceed-seed-phrase',
  doNotSaveSeedBtn: 'do-not-save-seed-button',
  saveAsDefaultSeedBtn: 'save-seed-button',
  getStartedBtnImport: 'get-started-button-import',
  enterPassField: 'enter-pass-field',
  repeatPassField: 'repeat-pass-field',
  keystoreBtnCreate: 'keystore-button-create',
  keystoreBtnContinue: 'keystore-button-continue',
  editBtnForEditNameField: 'edit-btn-for-edit-name-field',
  editFieldNameField: 'edit-name-field',
  getStartedBtnAdd: 'get-started-button-add',
  addressEnsField: 'address-ens-field',
  viewOnlyAddressField: 'view-only-address-field',
  viewOnlyBtnImport: 'view-only-button-import',
  addOneMoreAddress: 'add-one-more-address',
  address: 'address',
  buttonAddAccount: 'button-add-account',
  watchAddress: 'watch-address',
  checkbox: 'checkbox',
  addAccount: 'add-account',
  buttonImportAccount: 'button-import-account',
  seedPhraseInputFieldDynamic: 'seed-phrase-field',
  getStartedCreateHotWallet: 'get-started-create-hot-wallet',
  setUpWithSeedPhraseBtn: 'set-up-with-seed-phrase-btn',
  createSeedPrepareCheckboxDyn: 'create-seed-prepare-checkbox',
  reviewSeedPhraseBtn: 'review-seed-phrase-btn',
  recoveryWithSeedWordDyn: 'recovery-with-seed-word',
  createSeedPhraseWriteContinueBtn: 'create-seed-phrase-write-continue-btn',
  seedWordNumberToBeEntered: 'seed-word-number-to-be-entered',
  seedWordPositionFieldDyn: 'seed-word-position-field',
  createSeedPhraseConfirmContinueBtn: 'create-seed-phrase-confirm-continue-btn',
  personalizeAccount: 'personalize-account',
  pinExtensionCloseBtn: 'pin-extension-close-btn',
  accountSelectBtn: 'account-select-btn',
  selectSeedPhraseLength: 'select-seed-phrase-length',
  option24WordsSeedPhrase: 'option-24-word-seed-phrase',
  selectChangeHdPath: 'select-change-hd-path',
  optionBip44LedgerLive: 'option-bip44-ledger-live',
  importExistingWallet: 'import-existing-wallet',
  optionLegacyLedgerMyEtherWalletMyCrypto: 'option-legacy-ledger-myetherwallet-mycrypto',
  getStartedButtonConnectHwWallet: 'get-started-button-connect-hw-wallet',
  selectHwOptionTrezor: 'select-hw-option-trezor',
  trezorPermissionConfirmButton: '@permissions/confirm-button',
  trezorExportAddressConfirmButton: '@export-address/confirm-button',
  enterCurrentPassField: 'enter-current-pass-field',
  enterNewPassField: 'enter-new-pass-field',
  repeatNewPassField: 'repeat-new-pass-field',
  changeDevicePassButton: 'change-device-pass-button',
  bottomSheet: 'bottom-sheet',
  devicePassSuccessModal: 'device-pass-success-modal',
  lockExtensionButton: 'lock-extension-button',
  createKeystorePassBtn: 'create-keystore-pass-btn',
  passphraseField: 'passphrase-field',
  buttonUnlock: 'button-unlock',
  fullBalance: 'full-balance',
  tabNft: 'tab-nft',
  collectionItem: 'collection-item',
  collectiblePicture: 'collectible-picture',
  collectibleRow: 'collectible-row',
  addressBookMyWalletContactDyn: 'address-book-my-wallet-contact',
  dashboardButtonSend: 'dashboard-button-send',
  amountField: 'amount-field',
  recipientAddressUnknownCheckbox: 'recipient-address-unknown-checkbox',
  transferButtonConfirm: 'transfer-button-confirm',
  addAccountField: 'add-account-field',
  importExistingSeedBtn: 'import-existing-seed-btn',
  createSeedBtn: 'create-seed-btn',
  importFromSavedSeed: 'import-from-saved-seed',
  nativeTokenPolygonDyn: 'token-0x0000000000000000000000000000000000000000-polygon',
  topUpButton: 'top-up-button',
  tokenSend: 'token-send',
  queueAndSignLaterButton:'queue-and-sign-later-button',
  deleteTxnCallDyn:'delete-txn-call',
  feeSlow:'fee-slow:',
  feeMedium:'fee-medium:',
  feeFast:'fee-fast:',
  feeApe:'fee-ape:',
  transactionButtonReject:'transaction-button-reject'

}

type SelectorKey = keyof typeof TEST_IDS
type Selectors = { [K in SelectorKey]?: string }

export const SELECTORS: Selectors = Object.fromEntries(
  Object.entries(TEST_IDS).map(([key, value]) => [key, buildSelector(value)])
)
