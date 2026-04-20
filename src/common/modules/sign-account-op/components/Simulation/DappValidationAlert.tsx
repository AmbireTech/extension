import React from 'react'

import WarningFilledIcon from '@common/assets/svg/WarningFilledIcon'
import AlertVertical from '@common/components/AlertVertical'
import Text from '@common/components/Text'
import textStyles from '@common/styles/utils/text'

interface Props {
  text: string
}

const DappValidationAlert = ({ text }: Props) => {
  return (
    <AlertVertical
      type="warning"
      customIcon={() => <WarningFilledIcon width={48} height={44} />}
      text={
        <Text appearance="warningText" weight="semiBold" style={textStyles.center}>
          {text}
        </Text>
      }
    />
  )
}

export default React.memo(DappValidationAlert)
