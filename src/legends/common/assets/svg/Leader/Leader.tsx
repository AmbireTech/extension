import React from 'react'
import Svg, { Path, SvgProps } from 'react-native-svg'

interface LeaderProps extends SvgProps {
  variant?: string
}

const Leader = ({ width = 24, height = 24, variant = '' }: LeaderProps) => {
  if (variant === 'filled') {
    return (
      <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
        <Path
          d="M16.0416 9C17.5646 10.3353 18.5515 12.5969 17.6653 14.7052C17.4743 15.1594 17.0362 15.4539 16.5515 15.4539C16.0586 15.4539 15.2491 15.296 15.0918 15.9374L13.9946 20.4123C13.7658 21.3454 12.9435 22 12.0002 22C11.0568 22 10.2345 21.3454 10.0057 20.4123L8.90845 15.9374C8.75116 15.296 7.94161 15.4539 7.44874 15.4539C6.96402 15.4539 6.52594 15.1594 6.335 14.7052C5.44879 12.5969 6.4357 10.3353 7.95869 9"
          fill="#F7BA2F"
        />
        <Path
          d="M16.0416 9C17.5646 10.3353 18.5515 12.5969 17.6653 14.7052C17.4743 15.1594 17.0362 15.4539 16.5515 15.4539C16.0586 15.4539 15.2491 15.296 15.0918 15.9374L13.9946 20.4123C13.7658 21.3454 12.9435 22 12.0002 22C11.0568 22 10.2345 21.3454 10.0057 20.4123L8.90845 15.9374C8.75116 15.296 7.94161 15.4539 7.44874 15.4539C6.96402 15.4539 6.52594 15.1594 6.335 14.7052C5.44879 12.5969 6.4357 10.3353 7.95869 9"
          stroke="#706048"
          strokeLinecap="round"
        />
        <Path
          d="M12 9.5C12.5463 9.5 13.0647 9.30261 13.4978 9.04916C13.9401 8.79029 14.3556 8.43707 14.7125 8.03636C15.4063 7.25723 16 6.15534 16 5C16 2.79088 14.2092 1 12 1C9.7908 1 8 2.79088 8 5C8 6.15534 8.59369 7.25723 9.28752 8.03636C9.64436 8.43707 10.0599 8.79029 10.5022 9.04916C10.9353 9.30261 11.4537 9.5 12 9.5Z"
          fill="#F7BA2F"
          stroke="#F5EDE2"
          strokeWidth="2"
        />
        <Path
          d="M12 9C12.4284 9 12.859 8.84371 13.2452 8.61764C13.6361 8.38886 14.012 8.07117 14.3391 7.70384C14.9834 6.98033 15.5 5.99188 15.5 5C15.5 3.06701 13.933 1.5 12 1.5C10.067 1.5 8.5 3.06701 8.5 5C8.5 5.99188 9.01662 6.98033 9.66092 7.70384C9.98803 8.07117 10.3639 8.38886 10.7548 8.61764C11.141 8.84371 11.5716 9 12 9Z"
          fill="#F7BA2F"
          stroke="#706048"
        />
      </Svg>
    )
  }

  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 5C15 6.65685 13.2418 8.5 12 8.5C10.7582 8.5 9 6.65685 9 5C9 3.34315 10.3431 2 12 2C13.6569 2 15 3.34315 15 5Z"
        stroke="#706048"
        strokeOpacity="0.5"
        strokeWidth="1.5"
      />
      <Path
        d="M16.0416 9C17.5646 10.3353 18.5515 12.5969 17.6653 14.7052C17.4743 15.1594 17.0362 15.4539 16.5515 15.4539C16.0586 15.4539 15.2491 15.296 15.0918 15.9374L13.9946 20.4123C13.7658 21.3454 12.9435 22 12.0002 22C11.0568 22 10.2345 21.3454 10.0057 20.4123L8.90845 15.9374C8.75116 15.296 7.94161 15.4539 7.44874 15.4539C6.96402 15.4539 6.52594 15.1594 6.335 14.7052C5.44879 12.5969 6.4357 10.3353 7.95869 9"
        stroke="#706048"
        strokeOpacity="0.5"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  )
}

export default Leader
