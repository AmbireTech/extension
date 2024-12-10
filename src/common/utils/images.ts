const preloadImages = (images: string[]) => {
  images.forEach((src) => {
    const img = new Image()
    img.src = src
  })
}

export { preloadImages }
