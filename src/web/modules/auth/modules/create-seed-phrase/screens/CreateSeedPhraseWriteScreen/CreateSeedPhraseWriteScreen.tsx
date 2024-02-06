import React, { useEffect } from 'react'
import { View } from 'react-native'

import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import BackButton from '@common/components/BackButton'
import Button from '@common/components/Button'
import Input from '@common/components/Input'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useStepper from '@common/modules/auth/hooks/useStepper'
import Header from '@common/modules/header/components/Header'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import CreateSeedPhraseSidebar from '@web/modules/auth/modules/create-seed-phrase/components/CreateSeedPhraseSidebar'
import Stepper from '@web/modules/router/components/Stepper'

const MNEMONIC = [
  'word1',
  'word2',
  'word3',
  'word4',
  'word5',
  'word6',
  'word7',
  'word8',
  'word9',
  'word10',
  'word11',
  'word12'
]

const CreateSeedPhraseWriteScreen = () => {
  const { updateStepperState } = useStepper()
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { theme } = useTheme()

  useEffect(() => {
    updateStepperState('secure-seed', 'create-seed')
  }, [updateStepperState])

  return (
    <TabLayoutContainer
      backgroundColor={theme.secondaryBackground}
      header={
        <Header mode="custom-inner-content" withAmbireLogo>
          <Stepper />
        </Header>
      }
      footer={
        <>
          <BackButton />
          <Button
            accessibilityRole="button"
            text={t('Continue')}
            style={{ minWidth: 180 }}
            hasBottomSpacing={false}
            onPress={() => {
              navigate(WEB_ROUTES.createSeedPhraseConfirm)
            }}
          >
            <View style={spacings.pl}>
              <RightArrowIcon color={colors.titan} />
            </View>
          </Button>
        </>
      }
    >
      <TabLayoutWrapperMainContent>
        <Panel title="Recovery with Seed Phrase">
          <Text appearance="infoText" fontSize={16} style={spacings.mbXl}>
            {t('Write down and secure the Seed Phrase for your account')}
          </Text>
          <View style={[flexbox.directionRow, flexbox.wrap]}>
            {MNEMONIC.map((word, index) => (
              <View
                key={word}
                style={[
                  flexbox.directionRow,
                  flexbox.alignCenter,
                  (index + 1) % 4 !== 0 ? spacings.pr : {},
                  spacings.mb,
                  { width: '25%' }
                ]}
              >
                <Text fontSize={14} weight="medium" style={[{ width: 24 }]}>
                  {index + 1}.
                </Text>
                <Input
                  value={word}
                  numberOfLines={1}
                  containerStyle={[spacings.mb0, flexbox.flex1]}
                />
              </View>
            ))}
          </View>
        </Panel>
      </TabLayoutWrapperMainContent>
      <CreateSeedPhraseSidebar currentStepId="write" />
    </TabLayoutContainer>
  )
}

export default CreateSeedPhraseWriteScreen
