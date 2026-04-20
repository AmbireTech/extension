import React, { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import AddFromCurrentRecoveryPhraseIcon from '@common/assets/svg/AddFromCurrentRecoveryPhraseIcon'
import HWIcon from '@common/assets/svg/HWIcon'
import ImportAccountIcon from '@common/assets/svg/ImportAccountIcon'
import ImportJsonIcon from '@common/assets/svg/ImportJsonIcon'
import LatticeIcon from '@common/assets/svg/LatticeIcon'
import LedgerLetterIcon from '@common/assets/svg/LedgerLetterIcon'
import PrivateKeyIcon from '@common/assets/svg/PrivateKeyIcon'
import ReceiveIcon from '@common/assets/svg/ReceiveIcon'
import SafeIconGray from '@common/assets/svg/SafeIconGray'
import SeedPhraseIcon from '@common/assets/svg/SeedPhraseIcon'
import TrezorLockIcon from '@common/assets/svg/TrezorLockIcon'
import ViewOnlyIcon from '@common/assets/svg/ViewOnlyIcon'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Option from '@common/components/Option'
import { isMobile, isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import SavedSeedPhrasesBottomSheet from '@common/modules/account-select/components/SavedSeedPhrasesBottomSheet'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { ROUTES, WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'

import ExpandableOptionSection from './ExpandableOptionSection'

const AddAccount = ({
  sheetRef,
  closeBottomSheet,
  showImportOnly
}: {
  sheetRef: React.RefObject<any>
  closeBottomSheet: () => void
  showImportOnly?: boolean
}) => {
  const { t } = useTranslation()
  const { dispatch } = useControllersMiddleware()
  const { goToNextRoute, setTriggeredHwWalletFlow } = useOnboardingNavigation()
  const [height, setHeight] = useState<number>(0)
  const scrollViewRef = useRef<any>(null)

  const {
    ref: seedPhraseSheetRef,
    open: openSeedPhraseBottomSheet,
    close: closeSeedPhraseBottomSheet
  } = useModalize()
  const { seeds } = useController('KeystoreController').state

  const optionsHW = useMemo(() => {
    if (isMobile) return []

    return [
      {
        key: 'trezor',
        text: t('Trezor'),
        icon: TrezorLockIcon,
        onPress: () => {
          setTriggeredHwWalletFlow('trezor')
          dispatch({ type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_TREZOR' })
        },
        testID: 'trezor-option'
      },
      {
        key: 'ledger',
        text: t('Ledger'),
        icon: LedgerLetterIcon,
        onPress: () => {
          goToNextRoute(WEB_ROUTES.ledgerConnect)
        },
        testID: 'ledger-option'
      },
      {
        key: 'lattice',
        text: t('GridPlus'),
        icon: LatticeIcon,
        onPress: () => {
          setTriggeredHwWalletFlow('lattice')
          dispatch({ type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_LATTICE' })
        },
        testID: 'lattice-option'
      },
      {
        key: 'qr',
        text: t('QR-based'),
        icon: ReceiveIcon,
        onPress: () => {
          goToNextRoute(WEB_ROUTES.qrConnect)
        },
        testID: 'qr-option'
      }
    ]
  }, [dispatch, goToNextRoute, setTriggeredHwWalletFlow, t])

  const optionsImportAccount = useMemo(() => {
    return [
      {
        key: 'recovery-phrase',
        text: t('Recovery phrase'),
        icon: SeedPhraseIcon,
        onPress: () => goToNextRoute(ROUTES.importSeedPhrase),
        testID: 'import-recovery-phrase'
      },
      {
        key: 'private-key',
        text: t('Private key'),
        icon: PrivateKeyIcon,
        onPress: () => goToNextRoute(ROUTES.importPrivateKey),
        testID: 'import-private-key'
      },
      ...(!isMobile
        ? [
            {
              key: 'import-safe',
              text: t('Safe account'),
              icon: SafeIconGray,
              onPress: () => goToNextRoute(ROUTES.safeImport),
              testID: 'import-safe'
            },
            {
              key: 'json-backup-file',
              text: t('JSON backup file'),
              icon: ImportJsonIcon,
              onPress: () => goToNextRoute(ROUTES.importSmartAccountJson),
              testID: 'import-json-backup-file'
            }
          ]
        : [])
    ]
  }, [goToNextRoute, t])

  return (
    <BottomSheet
      id="add-account-bottom-sheet"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      scrollViewProps={
        isWeb
          ? {
              // Prevent the scroll view from expanding when a dropdown is open
              style: { maxHeight: height },
              showsVerticalScrollIndicator: false
            }
          : undefined
      }
      scrollViewRef={scrollViewRef}
      containerInnerWrapperStyles={isWeb ? spacings.pr0 : {}}
    >
      <View
        onLayout={(e) => {
          if (scrollViewRef.current) {
            const heightChange = Math.abs(e.nativeEvent.layout.height - height)
            // Scroll down a bit so the user can see the options
            if (e.nativeEvent.layout.height > height) {
              scrollViewRef.current.scrollTo({ y: heightChange / 2, animated: true })
            }
          }

          if (height) return

          setHeight(e.nativeEvent.layout.height)
        }}
      >
        <ModalHeader handleClose={closeBottomSheet} title={t('Add an account')} />
        <Option
          text={t('Add from stored recovery phrases')}
          disabled={!seeds.length}
          icon={AddFromCurrentRecoveryPhraseIcon}
          onPress={openSeedPhraseBottomSheet as any}
          testID="add-from-current-recovery-phrase"
          status="none"
        />
        {!showImportOnly && (
          <Option
            text={t('Create new recovery phrase')}
            icon={AddCircularIcon}
            onPress={() => goToNextRoute(ROUTES.createSeedPhrasePrepare)}
            testID="create-new-recovery-phrase"
            status="none"
          />
        )}
        <ExpandableOptionSection
          dropdownText={t('Import an account')}
          dropdownIcon={ImportAccountIcon}
          dropdownTestID="import-account"
          options={optionsImportAccount}
        />
        {!!optionsHW.length && (
          <ExpandableOptionSection
            dropdownText={t('Connect a hardware wallet')}
            dropdownIcon={HWIcon}
            dropdownTestID="connect-hardware-wallet"
            options={optionsHW}
          />
        )}
        {!showImportOnly && (
          <Option
            text={t('Watch an address')}
            icon={ViewOnlyIcon}
            onPress={() => goToNextRoute(ROUTES.viewOnlyAccountAdder)}
            testID="watch-an-address-button"
            status="none"
          />
        )}
      </View>

      <SavedSeedPhrasesBottomSheet
        sheetRef={seedPhraseSheetRef}
        open={openSeedPhraseBottomSheet}
        close={closeSeedPhraseBottomSheet}
        handleClose={closeSeedPhraseBottomSheet as any}
      />
    </BottomSheet>
  )
}

export default React.memo(AddAccount)
