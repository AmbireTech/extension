/* eslint-disable no-useless-escape */

function isValidHostname(string: string) {
  // Regular expression for validating hostname
  const regex = /^[a-zA-Z0-9]+([\-\.]{1}[a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/

  return regex.test(string)
}

export default isValidHostname
