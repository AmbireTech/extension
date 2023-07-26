import { NetworkId, NetworkType } from 'ambire-common/src/constants/networks'
import { UseAccountsReturnType } from 'ambire-common/src/hooks/useAccounts'
import { UseToastsReturnType } from 'ambire-common/src/hooks/useToasts'
import React from 'react'
import { View } from 'react-native'

import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import Title from '@common/components/Title'
import { useTranslation } from '@common/config/localization'
import { DepositTokenBottomSheetProvider } from '@common/modules/gas-tank/contexts/depositTokenBottomSheetContext'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

import TokensListItem from './TokensListItem'

interface Props {
  tokens: any[]
  isLoading: boolean
  networkId?: NetworkId
  chainId?: NetworkType['chainId']
  selectedAcc: UseAccountsReturnType['selectedAcc']
  addRequest: any
  addToast: UseToastsReturnType['addToast']
  closeBottomSheetTopUp: () => any
}

const TokensList = ({
  tokens,
  isLoading,
  networkId,
  chainId,
  selectedAcc,
  addRequest,
  addToast,
  closeBottomSheetTopUp
}: Props) => {
  const { t } = useTranslation()
  if (isLoading) {
    return (
      <View>
        <Text style={spacings.mbTy} fontSize={12}>
          {t('Available fee tokens')}
        </Text>
        <View style={[flexboxStyles.center, spacings.ptMd, spacings.pbLg]}>
          <Spinner />
        </View>
      </View>
    )
  }

  return (
    <DepositTokenBottomSheetProvider
      networkId={networkId}
      chainId={chainId}
      selectedAcc={selectedAcc}
      addRequest={addRequest}
      addToast={addToast}
      closeBottomSheetTopUp={closeBottomSheetTopUp}
    >
      <View>
        <Title style={[spacings.mtSm, text.center]}>{t('Available fee tokens')}</Title>
        {!!tokens &&
          tokens.map((token, i: number) => (
            <TokensListItem
              // eslint-disable-next-line react/no-array-index-key
              key={`token-${token.address}-${i}`}
              token={token}
              networkId={networkId}
            />
          ))}
      </View>
    </DepositTokenBottomSheetProvider>
  )
}

export default React.memo(TokensList)
