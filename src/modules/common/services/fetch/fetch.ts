export async function fetchPost(url: string, body: any) {
  const r = await fetch(url, {
    headers: { 'content-type': 'application/json' },
    method: 'POST',
    body: JSON.stringify(body)
  })
  return r.json()
}

export const fetchGet = async (url: string) => {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  if (response.status !== 200) throw new Error('Failed to fetch')
  return response.json()
}

export async function fetchCaught(url: string, params: any) {
  let resp
  try {
    resp = await fetch(url, params)
  } catch (e: any) {
    console.error(e)
    return { errMsg: `Unexpected error: ${e && e.message}` }
  }
  let body
  try {
    body = await resp.json()
  } catch (e: any) {
    console.error(e)
    return { errMsg: `Unexpected error: ${resp.status}, ${e && e.message}`, resp }
  }
  return { body, resp, errMsg: '' }
}
