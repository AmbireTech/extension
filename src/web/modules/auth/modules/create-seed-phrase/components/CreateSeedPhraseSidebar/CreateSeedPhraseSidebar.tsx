import React, { FC } from 'react'
import { View } from 'react-native'

import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import SeedPhraseRecoveryIcon from '@common/assets/svg/SeedPhraseRecoveryIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_MD } from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

const SIDEBAR_STEPS = [
  {
    id: 'prepare',
    text: 'Prepare a pen and\na piece of paper',
    icon: SeedPhraseRecoveryIcon
  },
  {
    id: 'write',
    text: 'Write down and secure\nthe Seed Phrase',
    icon: SeedPhraseRecoveryIcon
  },
  {
    id: 'confirm',
    text: 'Confirm your\nSeed Phrase',
    icon: SeedPhraseRecoveryIcon
  }
]

interface Props {
  currentStepId: 'prepare' | 'write' | 'confirm'
}

const CreateSeedPhraseSidebar: FC<Props> = ({ currentStepId }) => {
  const { theme } = useTheme()

  return (
    <View style={[spacings.pt, spacings.plXl]}>
      {SIDEBAR_STEPS.map(({ icon: Icon, text, id }, index) => {
        const isCurrent = currentStepId === id

        return (
          <View key={id} style={flexbox.alignCenter}>
            <View
              style={[
                flexbox.directionRow,
                flexbox.alignCenter,
                spacings.pv2Xl,
                spacings.pr3Xl,
                common.borderRadiusPrimary,
                {
                  backgroundColor: theme.primaryBackground,
                  borderWidth: 1,
                  borderColor: isCurrent ? theme.primary : theme.secondaryBorder,
                  paddingLeft: SPACING_MD * 2,
                  width: '100%',
                  opacity: isCurrent ? 1 : 0.6
                }
              ]}
            >
              <Text
                style={{
                  marginRight: SPACING_MD * 2,
                  width: 30
                }}
                fontSize={48}
                weight="semiBold"
                appearance="secondaryText"
              >
                {index + 1}
              </Text>
              <Icon
                color={isCurrent ? theme.primary : theme.secondaryText}
                width={48}
                height={48}
                style={spacings.mr}
              />
              <Text fontSize={14} weight="medium">
                {text}
              </Text>
            </View>
            {index !== SIDEBAR_STEPS.length - 1 && (
              <DownArrowIcon
                color={theme.primaryBorder}
                style={[
                  spacings.mvSm,
                  {
                    opacity: isCurrent ? 1 : 0.3
                  }
                ]}
                width={16}
                height={8}
              />
            )}
          </View>
        )
      })}
    </View>
  )
}

export default CreateSeedPhraseSidebar
