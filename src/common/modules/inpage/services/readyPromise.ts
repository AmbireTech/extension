class ReadyPromise {
  #allCheck: boolean[] = []

  #tasks: {
    resolve(value: unknown): void
    fn(): Promise<any>
  }[] = []

  constructor(count: number) {
    this.#allCheck = [...Array(count)]
  }

  check = (index: number) => {
    this.#allCheck[index - 1] = true
    this._proceed()
  }

  uncheck = (index: number) => {
    this.#allCheck[index - 1] = false
  }

  private _proceed = () => {
    if (this.#allCheck.some((_) => !_)) {
      return
    }

    while (this.#tasks.length) {
      const { resolve, fn } = this.#tasks.shift()!
      resolve(fn())
    }
  }

  call = (fn: any) => {
    return new Promise((resolve) => {
      this.#tasks.push({ fn, resolve })

      this._proceed()
    })
  }
}

export default ReadyPromise
