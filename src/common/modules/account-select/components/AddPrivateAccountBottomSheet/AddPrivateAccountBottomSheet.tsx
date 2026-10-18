import React, { useMemo } from 'react'
import { View } from 'react-native'

import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import Option from '@common/components/Option'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import { PrivacyProviderId } from '@ambire-common/interfaces/privateAccount'
import useController from '@common/hooks/useController'
import usePrivateAccounts from '@common/hooks/usePrivateAccounts'
import useTheme from '@common/hooks/useTheme'
import { PRIVACY_PROVIDER_NAMES } from '@common/modules/privacy/providers'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'
import useAddPrivateAccount from './useAddPrivateAccount'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectSeeds = (state: AllControllersMappingType['KeystoreController']) => state.seeds

type Props = {
  providerId: PrivacyProviderId
  sheetRef: React.RefObject<any>
  closeBottomSheet: () => void
  /** Called once the new account is added and selected. */
  onAdded: () => void
}

/**
 * Adds a private account of `providerId` from a stored recovery phrase (one per phrase and
 * provider) or a new one.
 */
const AddPrivateAccountBottomSheet = ({
  providerId,
  sheetRef,
  closeBottomSheet,
  onAdded
}: Props) => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
  const { state: seeds } = useController('KeystoreController', selectSeeds)
  const { accounts } = usePrivateAccounts()
  const { addFromStoredSeed, addFromNewSeed, pending } = useAddPrivateAccount({
    providerId,
    onAdded
  })
  const providerName = PRIVACY_PROVIDER_NAMES[providerId]
  // Privacy Pools' test ids predate the other providers
  const testIdPrefix =
    providerId === 'privacyPools' ? 'add-privacy-pools-account' : 'add-tornado-cash-account'

  const seedIdsWithAccount = useMemo(
    () =>
      new Set(
        accounts.filter((account) => account.providerId === providerId).map(({ seedId }) => seedId)
      ),
    [accounts, providerId]
  )

  const footer = useMemo(
    () => (
      <View style={styles.footer}>
        <View style={styles.footerDivider} />
        <Option
          text={
            pending?.kind === 'new-seed'
              ? t('Creating a new recovery phrase...')
              : t('Create new recovery phrase for it')
          }
          icon={AddCircularIcon}
          onPress={addFromNewSeed}
          disabled={!!pending}
          testID={`${testIdPrefix}-new-seed`}
          status="none"
        />
      </View>
    ),
    [addFromNewSeed, pending, styles.footer, styles.footerDivider, t, testIdPrefix]
  )

  return (
    <BottomSheet
      // Fixed: a new id remounts the sheet, which drops an `open` made as the provider changes
      id="add-private-account-bottom-sheet"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      FooterComponent={footer}
    >
      <ModalHeader
        handleClose={closeBottomSheet}
        title={t('Add a {{provider}} account', { provider: providerName })}
      />
      <Text fontSize={14} appearance="secondaryText" style={spacings.mbLg}>
        {t(
          'A {{provider}} account keeps your funds private. It is created from one of your recovery phrases, one account per phrase, and that phrase is the only way to recover it.',
          { provider: providerName }
        )}
      </Text>

      {(seeds || []).map((seed) => {
        const hasAccount = seedIdsWithAccount.has(seed.id)
        const isAddingThis = pending?.kind === 'stored-seed' && pending.seedId === seed.id

        return (
          <View key={seed.id} style={[styles.seedRow, hasAccount && styles.seedRowWithAccount]}>
            <Text
              fontSize={16}
              weight="medium"
              appearance={hasAccount ? 'secondaryText' : 'primaryText'}
              numberOfLines={1}
              style={[flexbox.flex1, spacings.mrSm]}
            >
              {seed.label}
            </Text>
            {hasAccount ? (
              <Text fontSize={16} weight="medium" appearance="secondaryText" style={spacings.phSm}>
                {t('Already added')}
              </Text>
            ) : (
              <Button
                testID={`${testIdPrefix}-${seed.id}`}
                text={isAddingThis ? t('Adding...') : t('Add')}
                size="small"
                type="outline"
                style={styles.addButton}
                textStyle={styles.addButtonText}
                hasBottomSpacing={false}
                disabled={!!pending}
                onPress={() => addFromStoredSeed(seed.id)}
              />
            )}
          </View>
        )
      })}
    </BottomSheet>
  )
}

export default React.memo(AddPrivateAccountBottomSheet)
