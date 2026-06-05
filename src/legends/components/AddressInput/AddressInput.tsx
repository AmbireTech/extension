import React, { FC } from 'react'

import { AddressState } from '@ambire-common/interfaces/domains'
import EnsIcon from '@common/assets/svg/EnsIcon'

import Input, { InputProps } from '../Input/Input'
import styles from './AddressInput.module.scss'

type Props = {
  addressState: AddressState
  setAddressState: React.Dispatch<React.SetStateAction<AddressState>>
  rightLabel?: string
} & Omit<InputProps, 'onChange' | 'value'>

const AddressInput: FC<Props> = ({
  label,
  rightLabel,
  addressState,
  validation,
  infoLabel,
  setAddressState,
  disabled
}) => {
  const { fieldValue, ensAddress } = addressState

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressState((prev) => ({
      ...prev,
      fieldValue: e.target.value
    }))
  }

  return (
    <div className={styles.wrapper}>
      <div style={{ display: 'flex' }}>
        <Input.Label label={label} className={`${styles.label}`} />
        <Input.Label label={rightLabel} className={`${styles.leftLabel} ${styles.label}`} />
      </div>
      <div className={styles.inputWrapper}>
        <Input.Field
          value={fieldValue}
          onChange={onChange}
          placeholder="Address / ENS"
          className={styles.input}
          disabled={disabled}
        />
        <div className={styles.domainsIcons}>
          <EnsIcon width={22} isActive={!!ensAddress} className={styles.ensIcon} />
        </div>
      </div>
      <Input.ValidationAndInfo validation={validation} infoLabel={infoLabel} />
    </div>
  )
}

export default AddressInput
