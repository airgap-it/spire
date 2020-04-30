/* eslint-disable @typescript-eslint/no-explicit-any */

export class Logger {
  private readonly name: string

  constructor(service: string) {
    this.name = service
  }

  public _log(color: string, method: string, args: any[]): void {
    const origin: string = `%c[${this.name}](${method})`
    const css: string = `background: #${color}`

    if (args.length === 0) {
      console.log(origin, css)
    } else if (args.every((arg: string) => typeof arg === 'string')) {
      console.log(`${origin}:`, css, args.join(' '))
    } else {
      console.log(`${origin}:`, css, args)
    }
  }

  public log(method: string, ...args: any[]): void {
    this._log('d3ffcf', method, args)
  }

  public warn(method: string, ...args: any[]): void {
    this._log('fff4cf', method, args)
  }

  public error(method: string, ...args: any[]): void {
    this._log('ffcfcf', method, args)
  }
}
