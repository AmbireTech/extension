import React, { useCallback, useMemo, useState } from 'react'
import { ScrollView, View } from 'react-native'

import AmbireLogoSquare from '@common/assets/svg/AmbireLogoSquare'
import LedgerLetterIcon from '@common/assets/svg/LedgerLetterIcon'
import NfcIcon from '@common/assets/svg/NfcIcon'
import PrivateKeyIcon from '@common/assets/svg/PrivateKeyIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import SafeIcon from '@common/assets/svg/SafeIcon'
import ScanIcon from '@common/assets/svg/ScanIcon'
import ViewOnlyIcon from '@common/assets/svg/ViewOnlyIcon'
import SeedPhraseIcon from '@common/assets/svg/SeedPhraseIcon'
import SingleKeyIcon from '@common/assets/svg/SingleKeyIcon'
import TrezorLockIcon from '@common/assets/svg/TrezorLockIcon'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import ExpandableImportMethod, {
  getImportMethodTestID,
  IMPORT_METHOD_ICON_SLOT_SIZE,
  ImportMethod
} from '@common/modules/auth/components/ExpandableImportMethod'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import useNfcAccountImport from '@common/modules/hardware-wallets/nfc/hooks/useNfcAccountImport'
import { NfcWalletConfigs } from '@common/modules/hardware-wallets/nfc/wallets'
import { NfcWalletIcons } from '@common/modules/hardware-wallets/nfc/wallets/icons'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

type ExpandableImportMethodTitle = 'Safe' | 'NFC card'

const ImportMethodButton = React.memo(
  ({
    title,
    onPress,
    icon: IconComponent,
    iconSize = IMPORT_METHOD_ICON_SLOT_SIZE,
    iconColor
  }: ImportMethod) => {
    const { theme } = useTheme()
    const { t } = useTranslation()

    return (
      <Button
        type="tertiary"
        onPress={onPress}
        testID={getImportMethodTestID(title)}
        childrenContainerStyle={{
          ...flexbox.directionRow,
          ...flexbox.alignCenter,
          ...flexbox.justifySpaceBetween,
          ...flexbox.flex1
        }}
      >
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <View
            style={[
              flexbox.center,
              { width: IMPORT_METHOD_ICON_SLOT_SIZE, height: IMPORT_METHOD_ICON_SLOT_SIZE }
            ]}
          >
            <IconComponent
              width={iconSize}
              height={iconSize}
              color={iconColor || theme.iconPrimary}
            />
          </View>
          <Text style={spacings.mlSm} fontSize={16} weight="medium">
            {t(title)}
          </Text>
        </View>
        <RightArrowIcon color={theme.iconPrimary} />
      </Button>
    )
  }
)

ImportMethodButton.displayName = 'ImportMethodButton'

const ImportExistingAccountSelectorScreen = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  const { goToPrevRoute, goToNextRoute } = useOnboardingNavigation()
  // One open at a time, so the list doesn't grow past the screen
  const [expandedMethodTitle, setExpandedMethodTitle] =
    useState<ExpandableImportMethodTitle | null>(null)
  // The card session runs on this screen: the tap and PIN prompts come up in the
  // globally mounted NfcCardSessionModal and the account picker follows.
  const { scanCard } = useNfcAccountImport()

  // The methods before Safe
  const buttons: ImportMethod[] = useMemo(
    () => [
      {
        // Accounts the user already has in the Ambire extension come over with a sync
        title: 'Already an Ambire user',
        onPress: () => {
          goToNextRoute(ROUTES.importFromExtension)
        },
        icon: AmbireLogoSquare,
        // The full Ambire purple, not the logo's default lighter tint
        iconColor: theme.primary
      },
      {
        title: 'Private key',
        onPress: () => {
          goToNextRoute(ROUTES.importPrivateKey)
        },
        icon: PrivateKeyIcon
      },
      {
        title: 'Recovery phrase',
        onPress: () => {
          goToNextRoute(ROUTES.importSeedPhrase)
        },
        icon: SeedPhraseIcon
      },
      {
        title: 'Ledger',
        onPress: () => {
          goToNextRoute(ROUTES.ledgerConnect)
        },
        icon: LedgerLetterIcon
      },
      {
        title: 'Trezor',
        onPress: () => {
          goToNextRoute(ROUTES.trezorConnect)
        },
        icon: TrezorLockIcon
      }
    ],
    [goToNextRoute, theme.primary]
  )

  const safeImportMethods: ImportMethod[] = useMemo(
    () => [
      {
        title: 'Safe by address',
        onPress: () => {
          goToNextRoute(ROUTES.safeImportAddress)
        },
        icon: SafeIcon,
        iconSize: 20
      },
      {
        title: 'Safe by owner',
        onPress: () => {
          goToNextRoute(ROUTES.safeImportByOwner)
        },
        icon: SingleKeyIcon
      }
    ],
    [goToNextRoute]
  )

  const goToQrConnect = useCallback(() => goToNextRoute(ROUTES.qrConnect), [goToNextRoute])

  const goToViewOnlyAccountAdder = useCallback(
    () => goToNextRoute(ROUTES.viewOnlyAccountAdder),
    [goToNextRoute]
  )

  const nfcCards: ImportMethod[] = useMemo(
    () =>
      NfcWalletConfigs.map(({ type, label }) => ({
        title: label,
        onPress: () => scanCard(type),
        icon: NfcWalletIcons[type]
      })),
    [scanCard]
  )

  const toggleExpandedMethod = useCallback((title: ExpandableImportMethodTitle) => {
    setExpandedMethodTitle((prevTitle) => (prevTitle === title ? null : title))
  }, [])
  const toggleSafeImportMethods = useCallback(
    () => toggleExpandedMethod('Safe'),
    [toggleExpandedMethod]
  )
  const toggleNfcCards = useCallback(() => toggleExpandedMethod('NFC card'), [toggleExpandedMethod])

  return (
    <MobileLayoutContainer>
      <MobileLayoutWrapperMainContent
        withBackButton
        onBackButtonPress={goToPrevRoute}
        title={t('Select import method')}
      >
        <View style={[flexbox.justifySpaceBetween, flexbox.flex1]}>
          <ScrollView contentContainerStyle={[flexbox.justifySpaceBetween]}>
            {buttons.map((button) => (
              <ImportMethodButton key={button.title} {...button} />
            ))}
            <ExpandableImportMethod
              title="Safe"
              icon={SafeIcon}
              iconSize={20}
              options={safeImportMethods}
              isExpanded={expandedMethodTitle === 'Safe'}
              onToggle={toggleSafeImportMethods}
            />
            <ImportMethodButton title="QR-based" onPress={goToQrConnect} icon={ScanIcon} />
            <ExpandableImportMethod
              title="NFC card"
              icon={NfcIcon}
              options={nfcCards}
              isExpanded={expandedMethodTitle === 'NFC card'}
              onToggle={toggleNfcCards}
            />
            <ImportMethodButton
              title="Watch an address"
              onPress={goToViewOnlyAccountAdder}
              icon={ViewOnlyIcon}
            />
          </ScrollView>
        </View>
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(ImportExistingAccountSelectorScreen)
