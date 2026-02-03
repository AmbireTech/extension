const TIME_TAKEN_CATEGORIES = {
  fast: {
    discovery: 500,
    priceUpdate: 500,
    oracleCall: 1000
  },
  // okay-ish slow is anything between fast and slow
  slow: {
    discovery: 1000,
    priceUpdate: 1000,
    oracleCall: 2000
  }
} as const

export { TIME_TAKEN_CATEGORIES }
