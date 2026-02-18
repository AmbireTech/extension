import { FC, useMemo } from 'react'
import { Pressable } from 'react-native'

import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  number?: number
  setPage?: (page: number) => void
  isActive?: boolean
  isDisabled?: boolean
}

const PaginationItem: FC<Props> = ({ number, setPage, isActive, isDisabled }) => {
  const { theme } = useTheme()

  const borderColor = useMemo(() => {
    if (!number) return 'transparent'

    if (isActive) return theme.primary

    return theme.secondaryBorder
  }, [isActive, number, theme.primary, theme.secondaryBorder])

  return (
    <Pressable
      disabled={isDisabled}
      onPress={() => {
        if (!number || !setPage) return

        setPage(number)
      }}
      style={{
        ...spacings.phMi,
        ...spacings.mhMi,
        ...flexbox.center,
        minWidth: 24,
        height: '100%',
        borderColor,
        opacity: isDisabled ? 0.4 : 1
      }}
    >
      <Text
        appearance={isActive ? 'primaryText' : 'secondaryText'}
        weight={isActive ? 'medium' : 'regular'}
      >
        {!number ? '...' : number}
      </Text>
    </Pressable>
  )
}

export default PaginationItem
