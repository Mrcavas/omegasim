import { App } from "./app.js"
import { MemFS } from "./memfs.js"
import { msToSec } from "./shared.js"
import { Tar } from "./tar.js"

import clangUrl from "./assets/clang.wasm?url"
import lldUrl from "./assets/lld.wasm?url"
import sysrootUrl from "./assets/sysroot.tar?url"
import OmegaHUrl from "./assets/Omega.h?url"
import OmegaCUrl from "./assets/Omega.c?url"

export class API {
  constructor(options) {
    this.moduleCache = {}
    this.hostWrite = options.hostWrite
    this.showTiming = options.showTiming || false

    this.memfs = new MemFS({
      hostWrite: this.hostWrite,
    })

    this.ready = this.memfs.ready
      .then(() => this.untar(this.memfs, sysrootUrl))
      .then(() =>
        fetch(OmegaHUrl).then(data =>
          data.arrayBuffer().then(buf => this.memfs.addFile("include/Omega.h", new Uint8Array(buf)))
        )
      )
      .then(() =>
        fetch(OmegaCUrl).then(data =>
          data.arrayBuffer().then(buf => this.memfs.addFile("Omega.cc", new Uint8Array(buf)))
        )
      )
      .then(() => this.getModule(clangUrl))
      .then(() => this.getModule(lldUrl))
      .then(() => this.compile({ input: "Omega.cc", obj: "Omega.o" }))
      .then(options.onReady)
  }

  async getModule(name) {
    if (this.moduleCache[name]) return this.moduleCache[name]
    const module = await this.hostLogAsync(
      `Fetching and compiling ${name}`,
      (async () => {
        const response = await fetch(name)
        return WebAssembly.compile(await response.arrayBuffer())
      })()
    )
    this.moduleCache[name] = module
    return module
  }

  hostLog(message) {
    const yellowArrow = "\x1b[1;93m>\x1b[0m "
    this.hostWrite(`${yellowArrow}${message}`)
  }

  async hostLogAsync(message, promise) {
    const start = +new Date()
    this.hostLog(`${message}...`)
    const result = await promise
    const end = +new Date()
    const green = "\x1b[92m"
    const normal = "\x1b[0m"

    this.hostWrite(` ✅\n`)

    if (this.showTiming) {
      this.hostWrite(` ${green}(${msToSec(start, end)}s)${normal}\n`)
    }
    return result
  }

  async untar(memfs, url) {
    await this.memfs.ready
    const promise = (async () => {
      const tar = new Tar(await fetch(url).then(result => result.arrayBuffer()))
      tar.untar(this.memfs)
    })()
    await this.hostLogAsync(`Untarring ${url}`, promise)
  }

  async compile(options) {
    const input = options.input
    const contents = options.contents
    const obj = options.obj

    if (contents !== undefined) this.memfs.addFile(input, contents)
    const clang = await this.getModule(clangUrl)
    await this.run(
      clang,
      "clang",
      "-cc1",
      "-emit-obj",
      "-disable-free",
      "-isysroot",
      "/",
      "-internal-isystem",
      "/include/c++/v1",
      "-internal-isystem",
      "/include",
      "-internal-isystem",
      "/lib/clang/8.0.1/include",
      "-ferror-limit",
      "19",
      "-fmessage-length",
      "80",
      "-fcolor-diagnostics",
      "-O2",
      "-o",
      obj,
      "-x",
      "c++",
      input
    )
    this.hostLog(`Compiled ${input}\n`)
  }

  async link(obj, wasm) {
    const stackSize = 1024 * 1024

    const libdir = "lib/wasm32-wasi"
    const crt1 = `${libdir}/crt1.o`

    await this.ready
    const lld = await this.getModule(lldUrl)
    return await this.run(
      lld,
      "wasm-ld",
      "--no-threads",
      "--export-dynamic", // TODO required?
      "--allow-undefined",
      "-z",
      `stack-size=${stackSize}`,
      `-L${libdir}`,
      crt1,
      "Omega.o",
      obj,
      "-lc",
      "-lc++",
      "-lc++abi",
      "-o",
      wasm
    )
  }

  async run(module, ...args) {
    // this.hostLog(`${args.join(" ")}`)
    const app = new App(module, this.memfs, ...args)

    return await app.run()
  }

  async compileLinkRun(contents, imports) {
    const input = `main.cc`
    const obj = `main.o`
    const wasm = `main.wasm`
    await this.compile({ input, contents, obj })
    await this.link(obj, wasm)

    const buffer = this.memfs.getFileContents(wasm)
    const main = await WebAssembly.compile(buffer)

    main.imports = imports
    const code = await this.run(main, wasm)
    this.hostLog(`Exited with code ${code}\n`)
  }
}
