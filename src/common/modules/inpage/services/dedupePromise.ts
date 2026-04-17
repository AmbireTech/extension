import { ethErrors } from 'eth-rpc-errors'

class DedupePromise {
  #blackList: string[]

  #tasks: Record<string, number> = {}

  constructor(blackList: string[]) {
    this.#blackList = blackList
  }

  async call(key: string, defer: () => Promise<any>) {
    if (this.#blackList.includes(key) && this.#tasks[key]) {
      throw ethErrors.rpc.transactionRejected(
        'there is a pending request, please request after it resolved'
      )
    }

    return new Promise((resolve) => {
      this.#tasks[key] = (this.#tasks[key] || 0) + 1

      resolve(
        defer().finally(() => {
          this.#tasks[key]--
          if (!this.#tasks[key]) {
            delete this.#tasks[key]
          }
        })
      )
    })
  }
}

export default DedupePromise
