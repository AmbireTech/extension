import React from 'react'

import PrivacyIcon from '@common/assets/svg/PrivacyIcon'
import PrivacyPoolsIcon from '@common/assets/svg/PrivacyPoolsIcon'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Option from '@common/components/Option'
import Text from '@common/components/Text'
import { isPrivacyPoolsEnabled, isTornadoCashEnabled } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import { PRIVACY_PROVIDER_NAMES } from '@common/modules/privacy/providers'
import spacings from '@common/styles/spacings'

import type { PrivacyProviderId } from '@ambire-common/interfaces/privateAccount'

type Props = {
  sheetRef: React.RefObject<any>
  closeBottomSheet: () => void
  onChoose: (providerId: PrivacyProviderId) => void
}

/** The step between "Add a Privacy account" and the provider's own add sheet. */
const ChoosePrivacyProviderBottomSheet = ({ sheetRef, closeBottomSheet, onChoose }: Props) => {
  const { t } = useTranslation()

  return (
    <BottomSheet
      id="choose-privacy-provider-bottom-sheet"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
    >
      <ModalHeader handleClose={closeBottomSheet} title={t('Add a Privacy account')} />
      <Text fontSize={14} appearance="secondaryText" style={spacings.mbLg}>
        {t(
          'A Privacy account keeps your funds private: what you send from it cannot be traced back to you. Choose how it keeps them private.'
        )}
      </Text>
      {isPrivacyPoolsEnabled && (
        <Option
          text={PRIVACY_PROVIDER_NAMES.privacyPools}
          icon={PrivacyPoolsIcon}
          onPress={() => onChoose('privacyPools')}
          testID="choose-privacy-provider-privacy-pools"
          status="none"
        />
      )}
      {isTornadoCashEnabled && (
        <Option
          text={PRIVACY_PROVIDER_NAMES.tornadoCash}
          // TODO: no Tornado Cash icon in src/common/assets/svg yet - replace PrivacyIcon with it
          icon={PrivacyIcon}
          onPress={() => onChoose('tornadoCash')}
          testID="choose-privacy-provider-tornado-cash"
          status="none"
        />
      )}
    </BottomSheet>
  )
}

export default React.memo(ChoosePrivacyProviderBottomSheet)
