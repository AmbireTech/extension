import React from 'react'

import Page from '@legends/components/Page'
import Actions from '@legends/modules/wallet/components/Actions'
import Home from '@legends/modules/wallet/components/Home'
import WalletBento from '@legends/modules/wallet/components/WalletBento'

const Wallet = () => {
  return (
    <Page containerSize="full">
      <Home />
      <WalletBento />
      <Actions />
    </Page>
  )
}

export default Wallet
