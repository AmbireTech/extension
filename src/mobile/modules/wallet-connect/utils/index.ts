export const getWcTabIdFromTopic = (topic: string) =>
  1_000_000 + (parseInt(topic.slice(0, 8), 16) % 900_000)
