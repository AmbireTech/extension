import React, { ReactNode, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated, Pressable, View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { SelectedAccountPortfolio } from '@ambire-common/interfaces/selectedAccount'
import TopUpIcon from '@common/assets/svg/TopUpIcon'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { isMobile, isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useHasGasTank from '@common/hooks/useHasGasTank'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getGasTankTokenDetails } from '@common/utils/getGasTankTokenDetails'
import { openInTab } from '@common/utils/links'
import { getUiType } from '@common/utils/uiType'

import getStyles from './styles'

type Props = {
  modalRef: any
  handleClose: () => void
  portfolio: SelectedAccountPortfolio
  account: Account | null
}

type Animation = { translateX: Animated.Value; opacity: Animated.Value; scale: Animated.Value }

const createAnimation = (): Animation => ({
  translateX: new Animated.Value(-50),
  opacity: new Animated.Value(0),
  scale: new Animated.Value(0.8)
})

const GasTankModal = ({ modalRef, handleClose, portfolio, account }: Props) => {
  const { isPopup } = getUiType()
  const { styles, theme } = useTheme(getStyles)
  const { addToast } = useToast()
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const {
    state: { networks }
  } = useController('NetworksController')
  const { canUseGasTank } = useHasGasTank({ account })
  const isSafe = !!account?.safeCreation

  // Note: total balance Gas Tank details
  const { token, balanceFormatted } = useMemo(
    () => getGasTankTokenDetails(portfolio, account, networks),
    [account, networks, portfolio]
  )

  return (
    <BottomSheet
      id="gas-tank-modal"
      type={isPopup || isMobile ? 'bottom-sheet' : 'modal'}
      sheetRef={modalRef}
      containerInnerWrapperStyles={styles.containerInnerWrapper}
      closeBottomSheet={handleClose}
      style={isWeb ? { maxWidth: 600 } : undefined}
      isScrollEnabled={false}
    >
      <ModalHeader title={t('Gas Tank')} handleClose={handleClose} />
      <View style={[flexbox.alignStart, spacings.mbLg]}>
        <Text fontSize={16} weight="medium" style={[spacings.mbTy]}>
          {t('Use Gas Tank to cover gas fees across most chains.')}
          {!canUseGasTank && '\n'}
          {!canUseGasTank && isSafe && t('Not available for Safe wallets, yet.')}
          {!canUseGasTank && !isSafe && t('Not available for hardware wallets, yet.')}
        </Text>
        <Pressable
          onPress={async () => {
            try {
              await openInTab({
                url: 'https://help.ambire.com/en/articles/13752152-what-is-the-gas-tank'
              })
            } catch {
              addToast("Couldn't open link", { type: 'error' })
            }
          }}
        >
          <Text color={theme.tertiaryText} weight="medium" underline>
            {t('Learn more >')}
          </Text>
        </Pressable>
      </View>
      <FooterGlassView
        size="sm"
        style={{ ...flexbox.flex1, alignItems: 'stretch' }}
        mobileStyle={{ flexDirection: 'column' }}
        innerContainerStyle={{
          ...flexbox.justifySpaceBetween,
          ...flexbox.alignCenter,
          ...flexbox.flex1
        }}
        absolute={false}
      >
        <View style={[flexbox.directionRow, isMobile && spacings.mbLg]}>
          <TokenIcon
            withContainer
            address={token?.address || ''}
            chainId={token?.chainId}
            onGasTank={token?.flags.onGasTank || false}
            containerHeight={40}
            containerWidth={40}
            width={32}
            height={32}
            withNetworkIcon={false}
          />
          <View style={spacings.ml}>
            <Text fontSize={14} appearance="secondaryText">
              {t('Balance')}
            </Text>
            <Text fontSize={20} weight="number_bold" testID="gas-tank-balance">
              {canUseGasTank ? `${balanceFormatted} ${token?.symbol || ''}` : '-'}
            </Text>
          </View>
        </View>
        <Button
          disabled={!canUseGasTank}
          testID="top-up-gas-tank-modal-button"
          type="primary"
          text={t('Top up')}
          size={isMobile ? 'regular' : 'smaller'}
          hasBottomSpacing={false}
          style={{
            minWidth: 128
          }}
          onPress={() => navigate('top-up-gas-tank')}
          childrenPosition="left"
        >
          <TopUpIcon color="#fff" width={24} height={24} style={spacings.mrMi} />
        </Button>
      </FooterGlassView>
    </BottomSheet>
  )
}

export default React.memo(GasTankModal)
