import React, { useState } from 'react'
import {} from 'react-native'
import DropDownPicker from 'react-native-dropdown-picker'

// import styles from './styles'

interface Props {
  value: string | null
  items: any[]
  setValue?: (value: any) => void
  setItems?: (items: any) => void
}

const Select = ({ value, setValue, items, setItems }: Props) => {
  const [open, setOpen] = useState(false)
  return (
    <DropDownPicker
      open={open}
      value={value}
      items={items}
      setOpen={setOpen}
      // @ts-ignore
      setValue={setValue}
      setItems={setItems}
    />
  )
}

export default Select
