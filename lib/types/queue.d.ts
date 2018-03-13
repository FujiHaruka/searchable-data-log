declare module 'queue' {
  export = Queue
}

declare function Queue (options: Queue.Options): Queue.Queue

declare namespace Queue {
    interface Options {
      [key: string]: any
    }

    class Queue {
      // 必要なものだけ

      length: number

      push (func: any): void

      once (event: string, callback: any): void
    }
}
