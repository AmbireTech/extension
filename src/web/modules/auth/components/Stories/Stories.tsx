import React, { useEffect, useMemo, useState } from 'react'
import { Image, Pressable, View } from 'react-native'

import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import Button from '@common/components/Button'
import Checkbox from '@common/components/Checkbox'
import Text from '@common/components/Text'
import { Trans, useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { iconColors } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

// @ts-ignore
import Story1 from './images/story-1.png'
// @ts-ignore
import Story2 from './images/story-2.png'
// @ts-ignore
import Story3 from './images/story-3.png'
// @ts-ignore
import Story4 from './images/story-4.png'
// @ts-ignore
import Story5 from './images/story-5.png'
// @ts-ignore
import Story6 from './images/story-6.png'
import getStyles from './styles'

export const ONBOARDING_VERSION = '1.0.0'

const Stories = ({ onComplete }: { onComplete: () => void }) => {
  const { theme, styles } = useTheme(getStyles)
  const [currentStory, setCurrentStory] = useState(0)
  const [agreedWithTerms, setAgreedWithTerms] = useState(false)
  const { t } = useTranslation()
  const { params } = useRoute()
  const { navigate } = useNavigation()

  useEffect(() => {
    if (params?.storyIndex) {
      setCurrentStory(params.storyIndex)
    }
  }, [params?.storyIndex])

  const STORIES_DATA = useMemo(() => {
    return [
      {
        id: 'story-1',
        // the gif is temporarily an image
        GIF: <Image source={Story1} style={styles.gif} />,
        Title: (
          <Text fontSize={20} weight="semiBold" style={spacings.mbSm}>
            {t('Welcome to Ambire Wallet!')}
          </Text>
        ),
        Description: (
          <Trans>
            <Text>
              <Text fontSize={14}>The first wallet to unlock the</Text>{' '}
              <Text fontSize={14} weight="semiBold">
                full power of Account Abstraction
              </Text>{' '}
              <Text fontSize={14}>without any compromise on user experience.</Text>
            </Text>
          </Trans>
        )
      },
      {
        id: 'story-2',
        // the gif is temporarily an image
        GIF: <Image source={Story2} style={styles.gif} />,
        Title: (
          <Text fontSize={20} weight="semiBold" style={spacings.mbSm}>
            {t('Ambire can replace Metamask everywhere!')}
          </Text>
        ),
        Description: (
          <Trans>
            <Text>
              <Text fontSize={14} weight="semiBold">
                Ambire works everywhere Metamask works
              </Text>{' '}
              <Text fontSize={14}>but with the added superpowers of Account Abstraction!</Text>
            </Text>
          </Trans>
        )
      },
      {
        id: 'story-3',
        // the gif is temporarily an image
        GIF: <Image source={Story3} style={styles.gif} />,
        Title: (
          <Text fontSize={20} weight="semiBold" style={spacings.mbSm}>
            {t('Pre-pay gas in any token on any chain!')}
          </Text>
        ),
        Description: (
          <Text fontSize={14}>
            {t(
              'Keep the same address on any available EVM chain and can add new networks. Create a smart account and pre-pay network fees in stablecoins and custom tokens.'
            )}
          </Text>
        )
      },
      {
        id: 'story-4',
        // the gif is temporarily an image
        GIF: <Image source={Story4} style={styles.gif} />,
        Title: (
          <Text fontSize={20} weight="semiBold" style={spacings.mbSm}>
            {t('The wallet protection you deserve!')}
          </Text>
        ),
        Description: (
          <Trans>
            <Text>
              <Text fontSize={14}>Built on</Text>{' '}
              <Text fontSize={14} weight="semiBold">
                battle-tested, and audited mutiple times
              </Text>{' '}
              <Text fontSize={14}>smart contracts developed by an OG team.</Text>{' '}
              <Text fontSize={14} weight="semiBold">
                Keep your funds safe
              </Text>{' '}
              <Text fontSize={14}>thanks to transaction simulation.</Text>
            </Text>
          </Trans>
        )
      },
      {
        id: 'story-5',
        // the gif is temporarily an image
        GIF: <Image source={Story5} style={styles.gif} />,
        Title: (
          <Text fontSize={20} weight="semiBold" style={spacings.mbSm}>
            {t('Create a smart contract wallet and get rewarded for using Ambire!')}
          </Text>
        ),
        Description: (
          <Trans>
            <Text>
              <Text fontSize={14}>
                The development of Ambire Wallet is governed by $WALLET holders in the WalletDAO.
                And the best part is that
              </Text>{' '}
              <Text fontSize={14} weight="semiBold">
                $WALLET is distributed to the community
              </Text>{' '}
              <Text fontSize={14}>of Ambire Wallet.</Text>
            </Text>
          </Trans>
        )
      },
      {
        id: 'story-6',
        // the gif is temporarily an image
        GIF: <Image source={Story6} style={styles.gif} />,
        Title: (
          <Text fontSize={20} weight="semiBold" style={spacings.mbSm}>
            {t('Terms of Service')}
          </Text>
        ),
        Description: (
          <View>
            <Trans>
              <Text style={spacings.mbLg}>
                <Text fontSize={14}>Ambire Wallet is an</Text>{' '}
                <Text fontSize={14} weight="semiBold">
                  open-source, non-custodial
                </Text>{' '}
                <Text fontSize={14}>cryptocurrency wallet.</Text>{' '}
                <Text
                  fontSize={14}
                  underline
                  color={theme.infoDecorative}
                  onPress={() => navigate('terms', { state: { storyIndex: 5 } })}
                >
                  Read full Terms of Service
                </Text>
                <Text fontSize={14}>...</Text>
              </Text>
            </Trans>
            <Checkbox
              value={agreedWithTerms}
              onValueChange={setAgreedWithTerms}
              uncheckedBorderColor={theme.primaryText}
              label={t('I agree to the Terms of Service and Privacy Policy.')}
            />
          </View>
        )
      }
    ]
  }, [t, styles, theme, agreedWithTerms, navigate])

  const moveToPrevStory = () => {
    if (currentStory !== 0) {
      setCurrentStory((p) => p - 1)
    }
  }

  const moveToNextStory = () => {
    if (currentStory !== STORIES_DATA.length - 1) {
      setCurrentStory((p) => p + 1)
    } else {
      !!onComplete && onComplete()
    }
  }

  const handleBulletPress = (bulletIndex: number) => {
    if (bulletIndex !== currentStory) setCurrentStory(bulletIndex)
  }

  return (
    <>
      {STORIES_DATA.map(({ id, GIF, Title, Description }, i) => (
        <View style={[styles.container, i !== currentStory && { display: 'none' }]} key={id}>
          {GIF}
          <View style={styles.contentContainer}>
            <View style={flexbox.flex1}>
              {Title}
              {Description}
            </View>
            <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifySpaceBetween]}>
              <View style={[flexbox.directionRow]}>
                {STORIES_DATA.map(({ id: bulletId }, bulletIndex) => (
                  <Pressable
                    key={`bullet-${bulletId}`}
                    style={({ hovered }: any) => [
                      styles.bullet,
                      currentStory === bulletIndex && styles.activeBullet,
                      currentStory !== bulletIndex && hovered && styles.hoveredBullet
                    ]}
                    onPress={() => handleBulletPress(bulletIndex)}
                  />
                ))}
              </View>
              <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                {currentStory !== 0 && (
                  <Button
                    type="ghost"
                    size="small"
                    text={t('Previous')}
                    style={{ minWidth: 96, ...spacings.mr }}
                    onPress={moveToPrevStory}
                    childrenPosition="left"
                    hasBottomSpacing={false}
                  >
                    <LeftArrowIcon color={iconColors.primary} style={spacings.mrTy} />
                  </Button>
                )}
                <Button
                  type="secondary"
                  size="small"
                  text={currentStory === STORIES_DATA.length - 1 ? t('Got it') : t('Next')}
                  style={{ minWidth: 96 }}
                  onPress={moveToNextStory}
                  hasBottomSpacing={false}
                  disabled={currentStory === STORIES_DATA.length - 1 && !agreedWithTerms}
                >
                  {currentStory !== STORIES_DATA.length - 1 && (
                    <RightArrowIcon color={theme.primary} style={spacings.mlSm} />
                  )}
                </Button>
              </View>
            </View>
          </View>
        </View>
      ))}
    </>
  )
}

export default React.memo(Stories)
