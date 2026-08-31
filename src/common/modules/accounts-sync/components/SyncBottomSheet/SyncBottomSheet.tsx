import React from 'react'
import { View } from 'react-native'

import ExportIcon from '@common/assets/svg/ExportIcon'
import ImportArrowIcon from '@common/assets/svg/ImportArrowIcon'
import SyncDevicesIcon from '@common/assets/svg/SyncDevicesIcon'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import { isMobile } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

// ExportIcon rotates itself into an up arrow, which is not the icon of the design.
// Overriding the style undoes it, leaving the arrow that leaves the box to the right.
const EXPORT_ICON_STYLE = { ...spacings.mrTy, transform: [{ rotate: '0deg' }] }

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

  return (
    <BottomSheet id="sync-accounts" sheetRef={sheetRef} closeBottomSheet={closeBottomSheet}>
      <ModalHeader
        handleClose={closeBottomSheet}
        title={isMobile ? t('Sync with extension') : t('Sync with mobile')}
      />
      <View style={[flexbox.alignCenter, spacings.mb2Xl]}>
        <SyncDevicesIcon />
      </View>
      <Button
        type="tertiary"
        text={isMobile ? t('Export to extension') : t('Export to mobile')}
        onPress={onExportPress}
        childrenPosition="left"
        testID="sync-export-option"
      >
        <ExportIcon width={20} height={20} style={EXPORT_ICON_STYLE} />
      </Button>
      <Button
        type="tertiary"
        text={isMobile ? t('Import from extension') : t('Import from mobile')}
        onPress={onImportPress}
        childrenPosition="left"
        hasBottomSpacing={false}
        testID="sync-import-option"
      >
        <ImportArrowIcon width={20} height={20} style={spacings.mrTy} />
      </Button>
    </BottomSheet>
  )
}

export default React.memo(SyncBottomSheet)
