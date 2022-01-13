import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Blockies from '@modules/common/components/Blockies'
import BottomSheet from '@modules/common/components/BottomSheet'
import useBottomSheet from '@modules/common/components/BottomSheet/hooks/useBottomSheet'
import Button from '@modules/common/components/Button'
import Panel from '@modules/common/components/Panel'
import Text from '@modules/common/components/Text'
import Title from '@modules/common/components/Title'
import networks from '@modules/common/constants/networks'
import useAccounts from '@modules/common/hooks/useAccounts'
import useNetwork from '@modules/common/hooks/useNetwork'
import colors from '@modules/common/styles/colors'
import spacings from '@modules/common/styles/spacings'
import flexboxStyles from '@modules/common/styles/utils/flexbox'
import textStyles from '@modules/common/styles/utils/text'

import styles from './styles'

const Accounts = () => {
  const { t } = useTranslation()
  const { accounts, selectedAcc, onRemoveAccount } = useAccounts()
  const { network, setNetwork, allNetworks } = useNetwork()
  const sheetNetworks = useBottomSheet()
  const sheetAccounts = useBottomSheet()

  const handleChangeNetwork = (chainId) => {
    setNetwork(chainId)
    sheetNetworks.closeBottomSheet()
  }

  const account = accounts.find(({ id }) => id === selectedAcc)
  const { name: networkName, Icon: NetworkIcon } = network

  return (
    <>
      <Panel>
        <Title>Accounts</Title>
        <View style={styles.accItemStyle} key={account?.id}>
          <Blockies size={8} scale={4} isRound={true} borderRadius={15} seed={account?.id} />
          <View style={[flexboxStyles.flex1, spacings.mlTy]}>
            <Text onPress={sheetAccounts.openBottomSheet} numberOfLines={1}>
              {account?.id}
            </Text>
          </View>
          {/* TODO */}
          {/* <Button onPress={() => onRemoveAccount(selectedAcc.id)} title="Remove" /> */}
          <View>
            <Trans>
              <Text onPress={sheetNetworks.openBottomSheet}>
                on <NetworkIcon style={{ marginTop: -3 }} />{' '}
                <Text style={textStyles.bold}>{networkName}</Text>
                <Text style={styles.chevron}> 🔽</Text>
              </Text>
            </Trans>
          </View>
        </View>
        {/* TODO: Copy address, Send, Receive  */}
      </Panel>
      <BottomSheet sheetRef={sheetNetworks.sheetRef}>
        <Title>{t('Change network')}</Title>

        {allNetworks.map(({ name, chainId }) => (
          <Button key={chainId} onPress={() => handleChangeNetwork(chainId)} text={name} />
        ))}
      </BottomSheet>
      <BottomSheet sheetRef={sheetAccounts.sheetRef}>
        <Title>{t('Change account')}</Title>

        {accounts.map((account: any) => (
          <View style={styles.accItemStyle} key={account?.id}>
            <Blockies size={8} scale={4} isRound={true} borderRadius={15} seed={account?.id} />
            <View style={[flexboxStyles.flex1, spacings.mlTy]}>
              <Text onPress={sheetAccounts.openBottomSheet} numberOfLines={1}>
                {account?.id}
              </Text>
            </View>
          </View>
        ))}
      </BottomSheet>
    </>
  )
}

export default Accounts
