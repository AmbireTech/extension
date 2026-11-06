import React, { useMemo } from 'react'
import { View } from 'react-native'

import EditableAccountName from '@common/components/EditableAccountName'
import PrivacyPoolsAccountAvatar from '@common/components/PrivacyPoolsAccountAvatar'
import PrivacyPoolsAccountIdentity from '@common/components/PrivacyPoolsAccountIdentity'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import getStyles from '@common/modules/account-personalize/components/AccountPersonalizeCard/styles'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const NAME_TEXT_PROPS = { weight: 'medium' } as const

type Props = {
  name: string
  /** Where the account comes from, shown where an address would be - it has none */
  sourceText: string
  disableEdit?: boolean
  // The name lives on the screen until the account is added, so this only updates it there
  onSaveName: (name: string) => Promise<void>
}

/** The personalize step's card of a Privacy Pools account, like `AccountPersonalizeCard`. */
const PrivacyPoolsAccountPersonalizeCard = ({
  name,
  sourceText,
  disableEdit,
  onSaveName
}: Props) => {
  const { styles } = useTheme(getStyles)

  const identity = useMemo(
    () => <PrivacyPoolsAccountIdentity sourceText={sourceText} />,
    [sourceText]
  )

  return (
    <View style={[styles.container, spacings.mb0]}>
      <View testID="personalize-account" style={[flexbox.directionRow, flexbox.alignCenter]}>
        <PrivacyPoolsAccountAvatar style={spacings.mrTy} />
        <View style={flexbox.flex1}>
          <View style={flexbox.directionRow}>
            <EditableAccountName
              identity={identity}
              name={name}
              onSave={onSaveName}
              testID="edit-name-field-0"
              textProps={NAME_TEXT_PROPS}
              disabled={disableEdit}
            />
          </View>
          <Text fontSize={12} appearance="secondaryText" numberOfLines={1}>
            {sourceText}
          </Text>
        </View>
      </View>
    </View>
  )
}

export default React.memo(PrivacyPoolsAccountPersonalizeCard)
