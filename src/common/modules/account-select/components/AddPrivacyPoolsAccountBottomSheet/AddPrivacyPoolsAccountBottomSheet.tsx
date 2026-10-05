import React, { useMemo } from 'react'
import { View } from 'react-native'

import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import Option from '@common/components/Option'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import usePrivacyPoolsAccounts from '@common/hooks/usePrivacyPoolsAccounts'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

import useAddPrivacyPoolsAccount from './useAddPrivacyPoolsAccount'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectSeeds = (state: AllControllersMappingType['KeystoreController']) => state.seeds

type Props = {
  sheetRef: React.RefObject<any>
  closeBottomSheet: () => void
  /** Called once the new account is added and selected. */
  onAdded: () => void
}

/** Adds a Privacy Pools account from a stored recovery phrase (one per phrase) or a new one. */
const AddPrivacyPoolsAccountBottomSheet = ({ sheetRef, closeBottomSheet, onAdded }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { state: seeds } = useController('KeystoreController', selectSeeds)
  const { accounts } = usePrivacyPoolsAccounts()
  const { addFromStoredSeed, addFromNewSeed, pending } = useAddPrivacyPoolsAccount({ onAdded })

  const seedIdsWithAccount = useMemo(
    () => new Set(accounts.map(({ seedId }) => seedId)),
    [accounts]
  )

  return (
    <BottomSheet
      id="add-privacy-pools-account-bottom-sheet"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
    >
      <ModalHeader handleClose={closeBottomSheet} title={t('Add a Privacy Pools account')} />
      <Text fontSize={14} appearance="secondaryText" style={spacings.mbLg}>
        {t(
          'A Privacy Pools account keeps your funds private. It is created from one of your recovery phrases, one account per phrase, and that phrase is the only way to recover it.'
        )}
      </Text>

      {!!seeds?.length && (
        <Text fontSize={14} weight="medium" style={spacings.mbTy}>
          {t('From a stored recovery phrase')}
        </Text>
      )}
      {(seeds || []).map((seed) => {
        const hasAccount = seedIdsWithAccount.has(seed.id)
        const isAddingThis = pending?.kind === 'stored-seed' && pending.seedId === seed.id

        return (
          <View
            key={seed.id}
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              flexbox.justifySpaceBetween,
              spacings.phSm,
              spacings.pvTy,
              spacings.mbTy,
              { borderRadius: BORDER_RADIUS_PRIMARY, backgroundColor: theme.secondaryBackground }
            ]}
          >
            <Text
              fontSize={14}
              weight="medium"
              numberOfLines={1}
              style={[flexbox.flex1, spacings.mrSm]}
            >
              {seed.label}
            </Text>
            {hasAccount ? (
              <Text fontSize={12} appearance="secondaryText">
                {t('Already added')}
              </Text>
            ) : (
              <Button
                testID={`add-privacy-pools-account-${seed.id}`}
                text={isAddingThis ? t('Adding...') : t('Add')}
                size="smaller"
                type="secondary"
                hasBottomSpacing={false}
                disabled={!!pending}
                onPress={() => addFromStoredSeed(seed.id)}
              />
            )}
          </View>
        )
      })}

      <View style={!!seeds?.length && spacings.mtSm}>
        <Option
          text={
            pending?.kind === 'new-seed'
              ? t('Creating a new recovery phrase...')
              : t('Create a new recovery phrase for it')
          }
          icon={AddCircularIcon}
          onPress={addFromNewSeed}
          disabled={!!pending}
          testID="add-privacy-pools-account-new-seed"
          status="none"
        />
      </View>
    </BottomSheet>
  )
}

export default React.memo(AddPrivacyPoolsAccountBottomSheet)
