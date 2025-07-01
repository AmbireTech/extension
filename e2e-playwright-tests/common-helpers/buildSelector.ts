export const buildSelector = (testId, index?) =>
  `[data-testid="${testId}${index !== undefined ? `-${index}` : ''}"]`
