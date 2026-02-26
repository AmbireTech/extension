import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Text from '@common/components/Text'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import styles from './styles'

// TODO: We need to implement a logic what will happen if we bump the version of the terms
// We need to make sure that the user will see the new terms and accept them
export const TERMS_VERSION = '1.0.0'

const TermsComponent = () => {
  const { t } = useTranslation()

  return (
    <View style={[flexbox.alignSelfCenter]}>
      <Text selectable style={[styles.text, styles.bold]}>
        {t('Effective starting 26 November 2021')}
      </Text>
      <Text selectable style={styles.text}>
        <Text selectable style={styles.text}>
          {t('Ambire Wallet is an open-source non-custodial cryptocurrency wallet:')}
        </Text>
        <ul style={{ paddingLeft: SPACING_SM, margin: 0 }}>
          <li>
            open-source: the software is provided &quot;as is&quot;, without warranty of any kind,
            express or implied, including but not limited to the warranties of merchantability,
            fitness for a particular purpose and noninfringement
          </li>
          <li>
            non-custodial: it is designed such that each user account is solely controlled by
            whoever holds the associated private keys. In other words, the end user retains full
            custody (possession) of their crypto funds at all times. As such, loss of funds is
            possible if the end user loses control over their private keys, for example but not
            limited to: losing their passphrase, losing access to their JSON backup, etc. The end
            user is solely responsible for the control over their private keys.
          </li>
        </ul>
      </Text>
      <Text selectable style={styles.text}>
        {t(
          'Those characteristics, combined with the decentralized nature of blockchain technologies such as Ethereum, mean that no single party is able to freeze, repossess or in any other way control the funds and actions of end users.'
        )}
      </Text>
      <Text selectable style={styles.text}>
        {t(
          "By using Ambire Wallet, you agree not to hold it's contributors and authors financially accountable for any loss of funds resulting from user error, software error, unauthorized access (hacks), or otherwise."
        )}
      </Text>
      <Text selectable style={styles.text}>
        {t(
          'Ambire Wallet contributors, authors and operators do not offer any business or investment advice. The content of the Ambire Wallet is not intended to be used as a guide for crypto-asset investments or signing of other legal agreements in connection to crypto-assets.'
        )}
      </Text>
      <Text selectable style={[styles.text, spacings.mbXl]}>
        {t(
          'Ambire Wallet contributors, authors and operators shall not be held accountable for any actions performed by end users.\nAs open-source software, the Ambire Wallet source code can be copied locally and/or ran by any party, and as such it does not depend on any operators or service providers. Any party may copy and develop the source code resulting in the formation of a distinct and separate software. The creation of forks cannot be avoided and end users are solely responsible for any losses and/or damages resulting from the use of forks. The end users are solely responsible and liable for any and all of your actions and inactions on the application and all gains and losses sustained from their use of the Ambire Wallet. The end user hereby indemnifies Ambire Wallet contributors, authors and operators in full for any and all negative consequences that might arise from the use of the application due to the lack of control over the peer-to-peer activities. Due to the permissionless and decentralized nature, the access to the Ambire Wallet is granted worldwide. The use of the Wallet, however, may be legally prohibited or technically restricted in certain territories and countries. End users are solely responsible to inform themselves of such legal restrictions and to comply with the legal norms applicable for them. Technically speaking, due to the open-source nature of Ambire Wallet, access to your funds will always be possible as long as you retain access to any of the private keys controlling the account. The activities conducted by the end users on the Wallet may result in the creation of a taxable event and end users may be objects of tax and fee payments to public authorities in different countries depending on the legal regulations. End users are obliged to inform themselves about such requirements and are solely responsible for their payments.'
        )}
      </Text>
    </View>
  )
}

export default React.memo(TermsComponent)
