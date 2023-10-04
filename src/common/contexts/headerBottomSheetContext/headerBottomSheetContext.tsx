import React, { createContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useModalize } from 'react-native-modalize'

import AccountChanger from '@common/components/AccountChanger'
import BottomSheet from '@common/components/BottomSheet'
import NetworkChanger from '@common/components/NetworkChanger'

export interface HeaderBottomSheetContextReturnType {
  openHeaderAccountsBottomSheet: (dest?: 'top' | 'default' | undefined) => void
  closeHeaderAccountsBottomSheet: (dest?: 'default' | 'alwaysOpen' | undefined) => void
  openHeaderNetworksBottomSheet: (dest?: 'top' | 'default' | undefined) => void
  closeHeaderNetworksBottomSheet: (dest?: 'default' | 'alwaysOpen' | undefined) => void
}

const HeaderBottomSheetContext = createContext<HeaderBottomSheetContextReturnType>({
  openHeaderAccountsBottomSheet: () => {},
  closeHeaderAccountsBottomSheet: () => {},
  openHeaderNetworksBottomSheet: () => {},
  closeHeaderNetworksBottomSheet: () => {}
})

const HeaderBottomSheetProvider: React.FC = ({ children }) => {
  const {
    ref: accountsSheetRef,
    open: openHeaderAccountsBottomSheet,
    close: closeHeaderAccountsBottomSheet
  } = useModalize()
  const {
    ref: networksSheetRef,
    open: openHeaderNetworksBottomSheet,
    close: closeHeaderNetworksBottomSheet
  } = useModalize()
  const { t } = useTranslation()

  return (
    <HeaderBottomSheetContext.Provider
      value={useMemo(
        () => ({
          closeHeaderAccountsBottomSheet,
          openHeaderAccountsBottomSheet,
          closeHeaderNetworksBottomSheet,
          openHeaderNetworksBottomSheet
        }),
        [
          closeHeaderAccountsBottomSheet,
          openHeaderAccountsBottomSheet,
          closeHeaderNetworksBottomSheet,
          openHeaderNetworksBottomSheet
        ]
      )}
    >
      {children}
      <BottomSheet
        id="header-switcher"
        sheetRef={accountsSheetRef}
        closeBottomSheet={closeHeaderAccountsBottomSheet}
        displayCancel={false}
      >
        <AccountChanger closeBottomSheet={closeHeaderAccountsBottomSheet} />
      </BottomSheet>
      <BottomSheet
        id="header-switcher"
        sheetRef={networksSheetRef}
        closeBottomSheet={closeHeaderNetworksBottomSheet}
        cancelText={t('Close')}
      >
        <NetworkChanger closeBottomSheet={closeHeaderNetworksBottomSheet} />
      </BottomSheet>
    </HeaderBottomSheetContext.Provider>
  )
}

export { HeaderBottomSheetContext, HeaderBottomSheetProvider }
