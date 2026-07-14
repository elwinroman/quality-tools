import os from 'os'
import pc from 'picocolors'

const enum host {
  LOCAL = '127.0.0.1',
  EXPOSE = '0.0.0.0',
}

type Host = host.LOCAL | host.EXPOSE

interface Network {
  address: string
  netmask: string
  family: string
  mac: string
}

export class NetworkController {
  private port: number
  private isExpose: boolean
  private host: Host
  private ipv4: Network[]

  constructor(port: number) {
    this.port = port
    this.isExpose = process.argv.find(arg => arg === '--host') ? true : false
    this.host = this.isExpose ? host.EXPOSE : host.LOCAL
    this.ipv4 = []
    this.networksIPv4()
  }

  private networksIPv4(): void {
    const interfaces = os.networkInterfaces()

    for (const net in interfaces) {
      const ipv4 = interfaces[net]?.find(element => element.family === 'IPv4')
      if (ipv4) this.ipv4.push(ipv4)
    }
  }

  public printNetworks(): void {
    console.clear()
    console.log(`\n ${pc.green(pc.bold('ALADDIN API'))} ${pc.gray('server running on')}`)
    console.log(`\n ${pc.green('➜')}  Local:   ${pc.yellow(`http://localhost:${this.port}/`)}`)

    if (this.isExpose) {
      for (const net of this.ipv4) {
        if (net.address !== host.LOCAL) console.log(` ${pc.green('➜')}  Network: ${pc.yellow(`http://${net.address}:${this.port}/`)}`)
      }
      return
    }

    if (!this.isExpose) {
      console.log(` ${pc.green('➜')} ${pc.gray(' Network: use')} --host ${pc.gray('to expose')}`)
    }
  }

  // getters
  public get gethost(): Host {
    return this.host
  }
}
