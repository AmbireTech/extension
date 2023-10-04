import React, { useEffect, useRef } from 'react'
import { View } from 'react-native'
import {
  CodeField,
  CodeFieldProps,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell
} from 'react-native-confirmation-code-field'

import Text from '@common/components/Text'
import useKeyboard from '@common/hooks/useKeybard'

import styles from './styles'

const CELL_COUNT = 6

interface Props extends Partial<CodeFieldProps> {
  enableMask?: boolean
  setValue: (value: string) => void
}

const InputPin: React.FC<Props> = ({
  enableMask = true,
  autoFocus,
  value = '',
  setValue,
  ...rest
}) => {
  const inputRef = useBlurOnFulfill({ value, cellCount: CELL_COUNT })
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value,
    setValue
  })
  // Used to disable auto focus once the keyboard is manually closed
  const autoFocusAllowed = useRef(true)

  const { keyboardShown } = useKeyboard()

  useEffect(() => {
    // autoFocus can be a static prop and this way it will function as a regular autoFocus
    // When InputPin should be focused on some other action (not component render), the autoFocus can be used as a boolean state
    //  in the parent component and trigger the focus when changing: false -> true
    if (autoFocus && !keyboardShown && autoFocusAllowed.current) {
      inputRef.current?.focus()
      autoFocusAllowed.current = false
    }
  }, [autoFocus, inputRef, keyboardShown])

  const renderCell: CodeFieldProps['renderCell'] = ({ index, symbol, isFocused }) => {
    let textChild = null

    if (symbol) {
      textChild = enableMask ? '•' : symbol
    } else if (isFocused) {
      textChild = <Cursor />
    }

    return (
      // React Native have issue with border styles for <Text/> on iOS.
      // {@link https://github.com/facebook/react-native/issues/23537}
      // To fix it need <View/> wrapper for Cell, but also move
      // onLayout={getCellOnLayoutHandler(index) to <View/>:
      <View
        // Moves the onLayout={getCellOnLayoutHandler(index)} prop
        // to root component of "Cell", because of the issue mentioned above.
        onLayout={getCellOnLayoutHandler(index)}
        key={index}
        style={[styles.cellRoot, isFocused && styles.focusCell]}
      >
        <Text style={styles.cellText}>{textChild}</Text>
      </View>
    )
  }

  return (
    <CodeField
      ref={inputRef}
      {...props}
      autoFocus={false}
      value={value}
      onChangeText={setValue}
      cellCount={CELL_COUNT}
      rootStyle={styles.codeFieldRoot}
      keyboardType="numeric"
      textContentType="password"
      {...rest}
      renderCell={renderCell}
    />
  )
}

export default InputPin
