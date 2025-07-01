const WHEEL_PRIZE_DATA: {
  [key: number]: { from: number; to: number }[]
} = {
  300: [
    {
      from: 11,
      to: -10
    }
  ],
  150: [
    {
      from: -215,
      to: -245
    }
  ],
  80: [
    {
      from: -46,
      to: -76
    },
    {
      from: -181,
      to: -211
    },
    {
      from: -247,
      to: -275
    }
  ],
  20: [
    { from: -110, to: -146 },
    {
      from: -315,
      to: -347
    }
  ],
  50: [
    {
      from: -13,
      to: -43
    },
    {
      from: -77,
      to: -109
    },
    {
      from: -148,
      to: -178
    },
    {
      from: -282,
      to: -313
    }
  ]
}

export default WHEEL_PRIZE_DATA
