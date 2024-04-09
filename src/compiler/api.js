import { App } from "./app.js"
import { MemFS } from "./memfs.js"
import { msToSec } from "./shared.js"
import { Tar } from "./tar.js"

export class API {
  constructor(options) {
    this.moduleCache = options.moduleCache ?? {}
    this.hostWrite = options.hostWrite
    this.hostCache = options.hostCache
    this.showTiming = options.showTiming || false

    this.memfs = new MemFS(this.getModule("/memfs.wasm"), {
      hostWrite: this.hostWrite,
    })

    this.ready = this.memfs.ready
      .then(() => this.untar(this.memfs, "/sysroot.tar"))
      .then(() =>
        fetch("/Omega.h").then(data =>
          data.arrayBuffer().then(buf => this.memfs.addFile("include/Omega.h", new Uint8Array(buf)))
        )
      )
      .then(() =>
        fetch("/Omega.c").then(data =>
          data.arrayBuffer().then(buf => this.memfs.addFile("Omega.cc", new Uint8Array(buf)))
        )
      )
      .then(() => this.getModule("/clang.wasm"))
      .then(() => this.getModule("/lld.wasm"))
      .then(() => this.compile({ input: "Omega.cc", obj: "Omega.o" }))
      .then(options.onReady)
  }

  async getModule(name) {
    if (this.moduleCache[name]) return this.moduleCache[name]

    const module = await this.hostLogAsync(
      `Fetching and compiling ${name}`,
      WebAssembly.compileStreaming(fetch(name, { cache: "force-cache" }))
    )

    this.moduleCache[name] = module
    this.hostCache(name, module)

    return module
  }

  hostLog(message) {
    const yellowArrow = "\x1b[12;93m>\x1b[0m "
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
      const tar = new Tar(await fetch(url, { cache: "force-cache" }).then(result => result.arrayBuffer()))
      tar.untar(this.memfs)
    })()
    await this.hostLogAsync(`Untarring ${url}`, promise)
  }

  async compile(options) {
    const input = options.input
    const contents = options.contents
    const obj = options.obj

    if (contents !== undefined) this.memfs.addFile(input, contents)
    const clang = await this.getModule("/clang.wasm")

    await this.hostLogAsync(
      `Compiling ${input}`,
      this.run(
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
        "/lib/clang/8.0.12/include",
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
    )
  }

  async link(obj, wasm) {
    const stackSize = 1024 * 1024

    const libdir = "lib/wasm32-wasi"
    const crt1 = `${libdir}/crt1.o`

    await this.ready
    const lld = await this.getModule("/lld.wasm")
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
    // this.hostLog(`${args.join(" ")}\n`)
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
