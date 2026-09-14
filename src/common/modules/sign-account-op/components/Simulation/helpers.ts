const isAccountOpSimulationCurrent = (currentAccountOpId?: string, simulatedAccountOpId?: string) =>
  !!currentAccountOpId && currentAccountOpId === simulatedAccountOpId

const getIsSimulationOutdated = ({
  currentAccountOpId,
  simulatedAccountOpId,
  hasInitialSimulationLoaded,
  hasSimulationError
}: {
  currentAccountOpId?: string
  simulatedAccountOpId?: string
  hasInitialSimulationLoaded: boolean
  hasSimulationError: boolean
}) => {
  if (!hasInitialSimulationLoaded) return false
  if (!simulatedAccountOpId && hasSimulationError) return false

  return !isAccountOpSimulationCurrent(currentAccountOpId, simulatedAccountOpId)
}

export { getIsSimulationOutdated, isAccountOpSimulationCurrent }
