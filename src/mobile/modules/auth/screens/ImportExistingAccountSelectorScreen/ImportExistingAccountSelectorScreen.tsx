import React, { useCallback, useMemo, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { SvgProps } from 'react-native-svg'

import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import LedgerLetterIcon from '@common/assets/svg/LedgerLetterIcon'
import NfcIcon from '@common/assets/svg/NfcIcon'
import PrivateKeyIcon from '@common/assets/svg/PrivateKeyIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import SafeIcon from '@common/assets/svg/SafeIcon'
import ScanIcon from '@common/assets/svg/ScanIcon'
import ViewOnlyIcon from '@common/assets/svg/ViewOnlyIcon'
import SeedPhraseIcon from '@common/assets/svg/SeedPhraseIcon'
import TrezorLockIcon from '@common/assets/svg/TrezorLockIcon'
import UpArrowIcon from '@common/assets/svg/UpArrowIcon'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import useNfcAccountImport from '@common/modules/hardware-wallets/nfc/hooks/useNfcAccountImport'
import { NfcWalletConfigs } from '@common/modules/hardware-wallets/nfc/wallets'
import { NfcWalletIcons } from '@common/modules/hardware-wallets/nfc/wallets/icons'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

// Keeps the expandable NFC section the same height as the regular size buttons
const ROW_HEIGHT = 56
const ICON_SLOT_SIZE = 24

type ImportMethod = {
  title: string
  onPress: () => void
  icon: React.FC<SvgProps>
  /**
   * Icons that fill their whole box (like SafeIcon) must be drawn smaller than the slot
   * to match the ones that draw a circle inset in it. The slot keeps the labels aligned.
   */
  iconSize?: number
}

const toTestID = (title: string) =>
  `import-method-${title.toLocaleLowerCase().split(' ').join('-')}`

const ImportMethodButton = React.memo(
  ({ title, onPress, icon: IconComponent, iconSize = ICON_SLOT_SIZE }: ImportMethod) => {
    const { theme } = useTheme()
    const { t } = useTranslation()

    return (
      <Button
        type="tertiary"
        onPress={onPress}
        testID={toTestID(title)}
        childrenContainerStyle={{
          ...flexbox.directionRow,
          ...flexbox.alignCenter,
          ...flexbox.justifySpaceBetween,
          ...flexbox.flex1
        }}
      >
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <View style={[flexbox.center, { width: ICON_SLOT_SIZE, height: ICON_SLOT_SIZE }]}>
            <IconComponent width={iconSize} height={iconSize} color={theme.iconPrimary} />
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

/** The cards live inside the section container, so they read as nested options. */
const NfcCardSection = React.memo(
  ({
    cards,
    isExpanded,
    onToggle
  }: {
    cards: ImportMethod[]
    isExpanded: boolean
    onToggle: () => void
  }) => {
    const { theme } = useTheme()
    const { t } = useTranslation()

    return (
      <View
        style={[
          spacings.mbSm,
          {
            // Darkens while expanded, matching the hover color of the other buttons
            backgroundColor: isExpanded ? theme.tertiaryBackground : theme.secondaryBackground,
            borderRadius: BORDER_RADIUS_PRIMARY,
            overflow: 'hidden'
          }
        ]}
      >
        <Pressable
          onPress={onToggle}
          testID={toTestID('NFC card')}
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            flexbox.justifySpaceBetween,
            spacings.phSm,
            { height: ROW_HEIGHT }
          ]}
        >
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <NfcIcon width={24} height={24} color={theme.iconPrimary} />
            <Text style={spacings.mlSm} fontSize={16} weight="medium">
              {t('NFC card')}
            </Text>
          </View>
          {isExpanded ? (
            <UpArrowIcon color={theme.iconPrimary} />
          ) : (
            <DownArrowIcon color={theme.iconPrimary} />
          )}
        </Pressable>
        {isExpanded && (
          <View style={[spacings.phTy, spacings.pbTy]}>
            {cards.map(({ title, onPress, icon: IconComponent }, index) => (
              <Pressable
                key={title}
                onPress={onPress}
                testID={toTestID(title)}
                style={[
                  flexbox.directionRow,
                  flexbox.alignCenter,
                  flexbox.justifySpaceBetween,
                  spacings.phSm,
                  spacings.pvSm,
                  !!index && spacings.mtTy,
                  {
                    backgroundColor: theme.secondaryBackground,
                    borderRadius: BORDER_RADIUS_PRIMARY
                  }
                ]}
              >
                <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                  <IconComponent width={24} height={24} color={theme.iconPrimary} />
                  <Text style={spacings.mlSm} fontSize={16} weight="medium">
                    {t(title)}
                  </Text>
                </View>
                <RightArrowIcon color={theme.iconPrimary} />
              </Pressable>
            ))}
          </View>
        )}
      </View>
    )
  }
)

NfcCardSection.displayName = 'NfcCardSection'

const ImportExistingAccountSelectorScreen = () => {
  const { t } = useTranslation()

  const { goToPrevRoute, goToNextRoute } = useOnboardingNavigation()
  const [areNfcCardsExpanded, setAreNfcCardsExpanded] = useState(false)
  // The card session runs on this screen: the tap and PIN prompts come up in the
  // globally mounted NfcCardSessionModal and the account picker follows.
  const { scanCard } = useNfcAccountImport()

  const buttons: ImportMethod[] = useMemo(
    () => [
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
        title: 'Safe',
        onPress: () => {
          goToNextRoute(ROUTES.safeImport)
        },
        icon: SafeIcon,
        iconSize: 20
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
      },
      {
        title: 'QR-based',
        onPress: () => {
          goToNextRoute(ROUTES.qrConnect)
        },
        icon: ScanIcon
      },
      {
        title: 'Watch an address',
        onPress: () => {
          goToNextRoute(ROUTES.viewOnlyAccountAdder)
        },
        icon: ViewOnlyIcon
      }
    ],
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

  const toggleNfcCards = useCallback(() => setAreNfcCardsExpanded((p) => !p), [])

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
            <NfcCardSection
              cards={nfcCards}
              isExpanded={areNfcCardsExpanded}
              onToggle={toggleNfcCards}
            />
          </ScrollView>
        </View>
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(ImportExistingAccountSelectorScreen)
