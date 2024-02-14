const mmReplacementsCode = `
// Find all shadow roots in the document
function findAllShadowRoots(n = document.body) {
  const shadowRoots = []

  function traverse(node) {
    if (node?.nodeType === Node.ELEMENT_NODE) {
      if (node.shadowRoot) {
        shadowRoots.push(node.shadowRoot)
        for (const child of node.shadowRoot.childNodes) {
          traverse(child)
        }
      }
      for (const child of node.childNodes) {
        traverse(child)
      }
    }
  }
  traverse(n)

  return shadowRoots
}

function getNumberOfWordOccurrencesInPage(word) {
  let wordCount = 0
  const allShadowRoots = findAllShadowRoots()
  for (const shadowRoot of allShadowRoots) {
    const textInShadowRoot = shadowRoot?.textContent || shadowRoot?.innerText
    wordCount += (textInShadowRoot?.match(new RegExp(word, 'gi')) || [])?.length || 0
  }
  const allText = document?.body?.textContent || document?.body?.innerText
  wordCount += (allText?.match(new RegExp(word, 'gi')) || [])?.length || 0

  return wordCount
}

function isWordInPage(word) {
  return getNumberOfWordOccurrencesInPage(word) !== 0
}

function replaceMMImgInPage() {
  const imgElements = document.getElementsByTagName('img')
  for (let i = 0; i < imgElements.length; i++) {
    if (imgElements[i].src.includes('metamask')) {
      imgElements[i].src = ambireSvg
    }
  }
}

const findAndReplaceIcon = (node, replacementIcon) => {
  const imgElement = node.querySelector('img')
  const svgElement = node.querySelector('svg')
  const imgElementByRole = node.querySelector('[role="img"]')
  const allDivs = node.querySelectorAll('div')

  const mmIconDivs = Array.from(allDivs).filter((div) => {
    const background = window.getComputedStyle(div).getPropertyValue('background')
    const backgroundImg = window.getComputedStyle(div).getPropertyValue('background-image')
    return background.includes('metamask') || backgroundImg.includes('metamask')
  })

  if (imgElement || svgElement || imgElementByRole || mmIconDivs.length) {
    const newImgElement = document.createElement('img')
    newImgElement.src = replacementIcon
    if (imgElement) {
      imgElement.src = replacementIcon
      imgElement.removeAttribute('srcset')
    }

    if (svgElement) {
      let shouldReplace = true
      if (svgElement.clientHeight) {
        if (svgElement.clientHeight < 14) {
          shouldReplace = false
        }
        newImgElement.style.height = svgElement.clientHeight + 'px'
      }
      if (svgElement.clientWidth) {
        if (svgElement.clientWidth < 14) {
          shouldReplace = false
        }
        newImgElement.style.width = svgElement.clientWidth + 'px'
      }
      if (shouldReplace) {
        svgElement.parentNode.insertBefore(newImgElement, svgElement)
        svgElement.style.display = 'none'
      }
    }

    if (imgElementByRole) {
      let shouldReplace = true
      if (imgElementByRole.clientHeight) {
        if (imgElementByRole.clientHeight < 14) {
          shouldReplace = false
        }
        newImgElement.style.height = imgElementByRole.clientHeight + 'px'
      }
      if (imgElementByRole.clientWidth) {
        if (imgElementByRole.clientWidth < 14) {
          shouldReplace = false
        }
        newImgElement.style.width = imgElementByRole.clientWidth + 'px'
      }
      if (shouldReplace) {
        imgElementByRole.parentNode.insertBefore(newImgElement, imgElementByRole)
        imgElementByRole.style.display = 'none'
      }
    }

    mmIconDivs.forEach((div) => {
      if (div.clientHeight) {
        newImgElement.style.height = div.clientHeight + 'px'
      }
      if (div.clientWidth) {
        newImgElement.style.width = div.clientWidth + 'px'
      }

      div.parentNode.insertBefore(newImgElement, div)
      div.style.display = 'none'
    })

    return true
  }

  return false
}

function replaceMMBrandInPage(replacementIcon) {
  let additionalNodes = []
  const onboardElement = document.querySelector('onboard-v2')
  const allShadowRoots = findAllShadowRoots()
  for (const shadowRoot of allShadowRoots) {
    additionalNodes = [...additionalNodes, ...Array.from(shadowRoot.querySelectorAll('*'))]
  }

  const nodes = [...Array.from(document.querySelectorAll('body, body *')), ...additionalNodes]
  nodes.forEach((node) => {
    Array.from(node.childNodes).forEach((childNode) => {
      if (childNode.nodeType === Node.TEXT_NODE) {
        const text = childNode.nodeValue

        if (
          replacementIcon &&
          (new RegExp('^metamask$', 'i').test(text.trim()) ||
            new RegExp('^connect by metamask$', 'i').test(text.trim()))
        ) {
          function lookForIcon() {
            let ancestorNode = childNode.parentNode
            let maxLevels = 4
            let shouldBreakWhileLoop = false
            while (ancestorNode && maxLevels > 0 && !shouldBreakWhileLoop) {
              maxLevels--
              const allNestedShadowRootsForAncestorNode = findAllShadowRoots(ancestorNode)
              if (allNestedShadowRootsForAncestorNode.length) {
                for (let i = 0; i < allNestedShadowRootsForAncestorNode.length; i++) {
                  const node = allNestedShadowRootsForAncestorNode[i]
                  const replaced = findAndReplaceIcon(node, replacementIcon)
                  if (replaced) {
                    shouldBreakWhileLoop = true
                    break
                  }
                }
              } else {
                const replaced = findAndReplaceIcon(ancestorNode, replacementIcon)
                if (replaced) break
              }

              ancestorNode = ancestorNode.parentNode
            }
          }

          // For some reason the onboard-v2 lib renders wallet icons async and we should
          // wait for the MM icon to be rendered in order to find it and replace it with our own icon
          if (onboardElement) {
            setTimeout(() => {
              lookForIcon()
            }, 400)
          } else {
            lookForIcon()
          }
        }

        const replacedText = text.replace(new RegExp('metamask', 'gi'), 'Ambire')

        if (text !== replacedText) {
          childNode.nodeValue = replacedText
        }
      }
    })
  })
}
`

export default mmReplacementsCode
