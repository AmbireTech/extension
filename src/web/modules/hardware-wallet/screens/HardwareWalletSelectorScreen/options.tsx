import LatticeIcon from '@common/assets/svg/LatticeIcon'
import LedgerIcon from '@common/assets/svg/LedgerIcon'
import TrezorIcon from '@common/assets/svg/TrezorIcon'

type Props = {
  onTrezorPress: () => void
  onLedgerPress: () => void
  onGridPlusPress: () => void
}

const getOptions = ({ onTrezorPress, onLedgerPress, onGridPlusPress }: Props) => [
  {
    title: 'Trezor',
    models: ['Trezor One', 'Trezor Model 3', 'Trezor Model T,\nTrezor Safe 3, Trezor Safe 5'],
    image: TrezorIcon,
    onPress: onTrezorPress
  },
  {
    title: 'Ledger',
    models: ['Ledger Nano', 'Ledger Nano X', 'Ledger Nano S Plus', 'Ledger Stax'],
    image: LedgerIcon,
    onPress: onLedgerPress
  },
  {
    title: 'GRID+',
    models: ['GRID+ Lattice1'],
    image: LatticeIcon,
    onPress: onGridPlusPress
  }
]

export default getOptions
