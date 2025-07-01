import React, { FC } from 'react'

type Props = {
  src: string
  className?: string
}

const YouTubeVideo: FC<Props> = ({ src, className }) => (
  <iframe
    src={src}
    title="YouTube Video Player"
    className={className ?? ''}
    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
    sandbox="allow-same-origin allow-scripts allow-popups allow-presentation"
  />
)

export default YouTubeVideo
