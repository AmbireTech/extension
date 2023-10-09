import { NetworkId, NetworkType } from 'ambire-common/src/constants/networks'
import { UseAccountsReturnType } from 'ambire-common/src/hooks/useAccounts'
import { UsePortfolioReturnType } from 'ambire-common/src/hooks/usePortfolio/types'
import React, { useContext } from 'react'
import { Linking } from 'react-native'

import AfterInteractions from '@common/components/AfterInteractions'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import TextWarning from '@common/components/TextWarning'
import { Trans } from '@common/config/localization'
import { AssetsToggleContext } from '@common/modules/dashboard/contexts/assetsToggleContext'
import spacings from '@common/styles/spacings'

import Collectibles from '../Collectibles'
import CollectiblesListLoader from '../Loaders/CollectiblesListLoader'
import TokensListLoader from '../Loaders/TokensListLoader'
import Tokens from '../Tokens'

interface Props {
  tokens: UsePortfolioReturnType['tokens']
  collectibles: UsePortfolioReturnType['collectibles']
  extraTokens: UsePortfolioReturnType['extraTokens']
  hiddenTokens: UsePortfolioReturnType['hiddenTokens']
  explorerUrl?: NetworkType['explorerUrl']
  networkId?: NetworkId
  networkName?: NetworkType['name']
  selectedAcc: UseAccountsReturnType['selectedAcc']
  isCurrNetworkBalanceLoading: boolean
  onAddExtraToken: UsePortfolioReturnType['onAddExtraToken']
  onAddHiddenToken: UsePortfolioReturnType['onAddHiddenToken']
  onRemoveExtraToken: UsePortfolioReturnType['onRemoveExtraToken']
  onRemoveHiddenToken: UsePortfolioReturnType['onRemoveHiddenToken']
}

const Assets = ({
  tokens,
  collectibles,
  extraTokens,
  hiddenTokens,
  explorerUrl,
  networkId,
  networkName,
  selectedAcc,
  isCurrNetworkBalanceLoading,
  onAddExtraToken,
  onAddHiddenToken,
  onRemoveExtraToken,
  onRemoveHiddenToken
}: Props) => {
  const { type } = useContext(AssetsToggleContext)
  const handleGoToBlockExplorer = () => Linking.openURL(`${explorerUrl}/address/${selectedAcc}`)

  return (
    <Panel
      style={{
        borderTopLeftRadius: type === 'tokens' ? 0 : 13,
        borderTopRightRadius: type === 'collectibles' ? 0 : 13
      }}
    >
      {type === 'tokens' && (
        <AfterInteractions
          placeholder={<TokensListLoader />}
          // Enabled only when the list contains multiple items that slow down the rendering/animations
          enabled={tokens.length > 20}
        >
          <Tokens
            tokens={tokens}
            extraTokens={extraTokens}
            hiddenTokens={hiddenTokens}
            networkId={networkId}
            networkName={networkName}
            isCurrNetworkBalanceLoading={!!isCurrNetworkBalanceLoading}
            onAddExtraToken={onAddExtraToken}
            onAddHiddenToken={onAddHiddenToken}
            onRemoveExtraToken={onRemoveExtraToken}
            onRemoveHiddenToken={onRemoveHiddenToken}
          />
        </AfterInteractions>
      )}
      {type === 'collectibles' && (
        <AfterInteractions
          placeholder={<CollectiblesListLoader />}
          // Enabled only when the list contains multiple items that slow down the rendering/animations
          enabled={collectibles.length > 5}
        >
          <Collectibles
            collectibles={collectibles}
            isCurrNetworkBalanceLoading={isCurrNetworkBalanceLoading}
          />
        </AfterInteractions>
      )}
      <TextWarning appearance="info" style={spacings.mb0}>
        <Trans>
          <Text type="caption">
            {/* eslint-disable-next-line react/no-unescaped-entities */}
            If you don't see a specific token that you own, please check the{' '}
            <Text weight="medium" type="caption" onPress={handleGoToBlockExplorer}>
              Block Explorer
            </Text>
          </Text>
        </Trans>
      </TextWarning>
    </Panel>
  )
}

export default React.memo(Assets)
