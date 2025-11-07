import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'
import { Modalize } from 'react-native-modalize'

import { Account } from '@ambire-common/interfaces/account'
import { SelectedAccountPortfolio } from '@ambire-common/interfaces/selectedAccount'
import { isSmartAccount } from '@ambire-common/libs/account/account'
import { PortfolioGasTankResult } from '@ambire-common/libs/portfolio/interfaces'
import BottomSheet from '@common/components/BottomSheet'
import DualChoiceModal from '@common/components/DualChoiceModal'
import Text from '@common/components/Text'
import useToast from '@common/hooks/useToast'
import getAndFormatTokenDetails from '@common/modules/dashboard/helpers/getTokenDetails'
import spacings from '@common/styles/spacings'
import { createTab } from '@web/extension-services/background/webapi/tab'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'

type Props = {
  id: string
  sheetRef: React.RefObject<Modalize>
  closeBottomSheet?: (dest?: 'alwaysOpen' | 'default' | undefined) => void
  onPrimaryButtonPress: () => void
  portfolio: SelectedAccountPortfolio
  account: Account | null
}

const GasTankInfoModal = ({
  id,
  sheetRef,
  closeBottomSheet,
  onPrimaryButtonPress,
  portfolio,
  account
}: Props) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const isSA = useMemo(() => isSmartAccount(account), [account])
  const { networks } = useNetworksControllerState()

  const token = useMemo(() => {
    const result = portfolio?.portfolioState?.gasTank?.result as PortfolioGasTankResult

    if (!isSA || !result) {
      return null
    }

    return result.gasTankTokens ? result.gasTankTokens[0] : null
  }, [isSA, portfolio?.portfolioState?.gasTank?.result])

  const balanceFormatted = useMemo(
    () => (token ? getAndFormatTokenDetails(token, networks)?.balanceFormatted ?? 0 : 0),
    [networks, token]
  )

  return (
    <BottomSheet
      id={id}
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      backgroundColor="secondaryBackground"
      style={{ overflow: 'hidden', maxWidth: 496, ...spacings.ph0, ...spacings.pv0 }}
      type="modal"
    >
      <DualChoiceModal
        title={t('Gas Tank')}
        description={
          <View>
            <Text style={spacings.mbTy} appearance="secondaryText">
              {t('You have a total of ')}
              <Text weight="semiBold" appearance="secondaryText">
                {balanceFormatted} {token?.symbol || 'USDC'}
              </Text>
              {t(' on your Gas Tank.')}
            </Text>
            <Text style={spacings.mbTy} appearance="secondaryText">
              {t(
                'You can top up and use your Gas Tank balance to pay for future transactions on any Ambire-supported network, benefiting from lower fees and the convenience of unified fee management.'
              )}
            </Text>

            <Text appearance="secondaryText">
              {t(
                'Additionally, when using a Smart Account, cashback gets credited to your Gas Tank. Cashback comes from transaction savings and fee optimizations processed through the Ambire Relayer.'
              )}
              <Pressable
                onPress={async () => {
                  try {
                    await createTab(
                      'https://help.ambire.com/hc/en-us/articles/5397969913884-What-is-the-Gas-Tank'
                    )
                  } catch {
                    addToast("Couldn't open link", { type: 'error' })
                  }
                }}
              >
                <Text style={[spacings.mlTy]} appearance="primary" weight="medium" fontSize={16}>
                  {t('Learn more')}
                </Text>
              </Pressable>
            </Text>
          </View>
        }
        primaryButtonText={t('Got it')}
        primaryButtonTestID="close-gas-tank-info-modal-button"
        onPrimaryButtonPress={onPrimaryButtonPress}
      />
    </BottomSheet>
  )
}

export default React.memo(GasTankInfoModal)
