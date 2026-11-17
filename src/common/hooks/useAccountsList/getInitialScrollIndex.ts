/**
 * Gives the row the accounts list should start at, capped to what the window can scroll
 * to so short lists don't render blank rows. Returns `undefined` to start at the top.
 */
const getInitialScrollIndex = ({
  selectedAccountIndex,
  accountsCount,
  itemHeight,
  windowHeight
}: {
  selectedAccountIndex: number
  accountsCount: number
  itemHeight: number
  windowHeight: number
}) => {
  const lastReachableIndex = Math.floor((accountsCount * itemHeight - windowHeight) / itemHeight)
  const initialScrollIndex = Math.min(selectedAccountIndex, lastReachableIndex)

  return initialScrollIndex > 0 ? initialScrollIndex : undefined
}

export default getInitialScrollIndex
