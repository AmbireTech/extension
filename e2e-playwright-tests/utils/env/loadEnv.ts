import dotenv from 'dotenv'
import path from 'path'
import validateEnv from './validateEnv'

const loadEnv = () => {
  try {
    if (process.env.CI) {
      const ciEnv = { ...process.env }
      validateEnv(ciEnv)
      return ciEnv
    }

    delete require.cache[require.resolve('dotenv')]

    const envPath = path.resolve(__dirname, '../../../.env')
    const { parsed, error } = dotenv.config({ path: envPath })

    if (error) {
      throw new Error(`Failed to load .env file: ${error.message}`)
    }

    if (!parsed || !Object.keys(parsed).length) {
      throw new Error(`No environment variables were loaded from ${envPath}`)
    }

    validateEnv(parsed)
    return parsed
  } catch (error) {
    console.error('Error loading environment variables:', (error as Error).message)
    throw error
  }
}

export default loadEnv
