import React from 'react'

import PrivacyPoolsAccountAvatar from '@common/components/PrivacyPoolsAccountAvatar'
import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'
import text from '@common/styles/utils/text'

type Props = {
  /** Where the account comes from, shown where an address would be - it has none */
  sourceText: string
}

/**
 * A Privacy Pools account in the rename sheet (`identity` of `EditableAccountName`), shown the way
 * the sheet shows an account's avatar and address
 */
const PrivacyPoolsAccountIdentity = ({ sourceText }: Props) => (
  <>
    <PrivacyPoolsAccountAvatar size={48} style={spacings.mbSm} />
    <Text fontSize={12} appearance="secondaryText" style={text.center}>
      {sourceText}
    </Text>
  </>
)

export default React.memo(PrivacyPoolsAccountIdentity)
