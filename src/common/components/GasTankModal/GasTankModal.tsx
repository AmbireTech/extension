import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { SelectedAccountPortfolio } from '@ambire-common/interfaces/selectedAccount'
import TopUpIcon from '@common/assets/svg/TopUpIcon'
import Alert from '@common/components/Alert'
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

const GAS_TANK_HELP_URL = 'https://help.ambire.com/en/articles/13752152-what-is-the-gas-tank'

type Props = {
  modalRef: any
  handleClose: () => void
  portfolio: SelectedAccountPortfolio
  account: Account | null
}

const GasTankModal = ({ modalRef, handleClose, portfolio, account }: Props) => {
  const { isPopup } = getUiType()
  const { styles, theme } = useTheme(getStyles)
  const { addToast } = useToast()
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const {
    state: { networks }
  } = useController('NetworksController')
  const {
    dispatch: featureFlagsDispatch,
    state: { flags }
  } = useController('FeatureFlagsController')
  const { canUseGasTank, disabledReason, requiresEip7702 } = useHasGasTank({ account })
  const isErc4337Enabled = flags.erc4337
  const isEip7702Enabled = flags.eip7702
  const isGasTankEnabled = isErc4337Enabled && (!requiresEip7702 || isEip7702Enabled)

  // Note: total balance Gas Tank details
  const { token, balanceFormatted } = useMemo(
    () => getGasTankTokenDetails(portfolio, account, networks),
    [account, networks, portfolio]
  )

  const handleLearnMorePress = useCallback(async () => {
    try {
      await openInTab({ url: GAS_TANK_HELP_URL })
    } catch {
      addToast("Couldn't open link", { type: 'error' })
    }
  }, [addToast])

  const handleEnableGasTankFeatures = useCallback(() => {
    if (!isErc4337Enabled) {
      featureFlagsDispatch({
        type: 'method',
        params: {
          method: 'setFeatureFlag',
          args: ['erc4337', true]
        }
      })
    }

    if (requiresEip7702 && !isEip7702Enabled) {
      featureFlagsDispatch({
        type: 'method',
        params: {
          method: 'setFeatureFlag',
          args: ['eip7702', true]
        }
      })
    }
  }, [featureFlagsDispatch, isEip7702Enabled, isErc4337Enabled, requiresEip7702])

  const enableGasTankText = useMemo(() => {
    if (!requiresEip7702 || isEip7702Enabled) {
      return t(
        'Enable ERC-4337 to use smart account gas estimation, gas tank, sponsored gas, and token fee payments.'
      )
    }

    if (isErc4337Enabled) {
      return t(
        'Enable EIP-7702 to use smart account gas estimation, gas tank, sponsored gas, and token fee payments.'
      )
    }

    return t(
      'Enable ERC-4337 and EIP-7702 to use smart account gas estimation, gas tank, sponsored gas, and token fee payments.'
    )
  }, [isEip7702Enabled, isErc4337Enabled, requiresEip7702, t])

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
      {isGasTankEnabled || !canUseGasTank ? (
        <View style={[flexbox.alignStart, spacings.mbLg]}>
          <Text fontSize={16} weight="medium" style={[spacings.mbTy]}>
            {t('Use Gas Tank to cover gas fees across most chains.')}
            {!canUseGasTank && (
              <Text appearance="warningText" fontSize={16} weight="medium">
                {'\n'}
                {disabledReason}
              </Text>
            )}
          </Text>
          <Pressable onPress={handleLearnMorePress}>
            <Text color={theme.tertiaryText} weight="medium" underline>
              {t('Learn more >')}
            </Text>
          </Pressable>
        </View>
      ) : (
        <Alert
          type="info"
          size="sm"
          title={t('Enable the gas tank right now!')}
          text={enableGasTankText}
          style={spacings.mbSm}
          buttonProps={{
            text: t('Enable'),
            onPress: handleEnableGasTankFeatures
          }}
        />
      )}

      {!isGasTankEnabled ? null : (
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
          <View style={[flexbox.directionRow, flexbox.alignCenter, isMobile && spacings.mbLg]}>
            <TokenIcon
              withContainer
              address={token?.address || ''}
              chainId={token?.chainId}
              onGasTank={token?.flags.onGasTank || false}
              containerHeight={40}
              containerWidth={40}
              width={40}
              height={40}
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
      )}
    </BottomSheet>
  )
}

export default React.memo(GasTankModal)
