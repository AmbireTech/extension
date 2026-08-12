import React from 'react'
import { View } from 'react-native'

import ExportIcon from '@common/assets/svg/ExportIcon'
import ImportIcon from '@common/assets/svg/ImportIcon'
import SyncDevicesIcon from '@common/assets/svg/SyncDevicesIcon'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Option from '@common/components/Option'
import { isMobile } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  sheetRef: React.RefObject<any>
  closeBottomSheet: () => void
  onExportPress: () => void
  onImportPress: () => void
}

/**
 * Entry point of the accounts sync, shown by both products: it only asks in which
 * direction the accounts should move. What happens next is up to the platform - the
 * extension opens a page, the mobile app opens another bottom sheet.
 */
const SyncBottomSheet = ({ sheetRef, closeBottomSheet, onExportPress, onImportPress }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  return (
    <BottomSheet id="sync-accounts" sheetRef={sheetRef} closeBottomSheet={closeBottomSheet}>
      <ModalHeader
        handleClose={closeBottomSheet}
        title={isMobile ? t('Sync with extension') : t('Sync with mobile')}
      />
      <View style={[flexbox.alignCenter, spacings.mbLg]}>
        <SyncDevicesIcon />
      </View>
      <Option
        text={isMobile ? t('Export to extension') : t('Export to mobile')}
        icon={ExportIcon}
        iconProps={{ color: theme.primaryText }}
        onPress={onExportPress}
        testID="sync-export-option"
      />
      <Option
        text={isMobile ? t('Import from extension') : t('Import from mobile')}
        icon={ImportIcon}
        iconProps={{ color: theme.primaryText }}
        onPress={onImportPress}
        testID="sync-import-option"
      />
    </BottomSheet>
  )
}

export default React.memo(SyncBottomSheet)
