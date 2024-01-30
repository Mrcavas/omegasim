import { API } from "./api.js"

let api
let port
let buffer, dataView
let currentOffset = 0

const sendMain = message => port.postMessage(message)
const sendPhys = message => port.postMessage({ id: "to_phys", message })
const hostWrite = msg => sendMain({ id: "write", data: msg })

const callPhysCb =
  name =>
  (...args) =>
    sendPhys({
      id: "call",
      name,
      args,
    })

const readStateCb = (size, unsigned) => {
  const offset = currentOffset
  currentOffset += size
  return value => dataView[`get${size === 8 ? "Big" : ""}${unsigned ? "Uint" : "Int"}${size * 8}`](offset, value)
}

const readUS = [readStateCb(2, true), readStateCb(2, true)]
const readLine = [readStateCb(2, true), readStateCb(2, true)]
const readBtn = [readStateCb(1), readStateCb(1), readStateCb(1)]

const imports = {
  millis() {
    return BigInt(Date.now())
  },
  delay(ms) {
    const start = Date.now()
    while (Date.now() - start < ms) eval("") // try to trick vite to not optimize this
  },
  setMotorLeft: callPhysCb("setMotorLeft"),
  setMotorRight: callPhysCb("setMotorLeft"),
  setLed: callPhysCb("setLed"),
  setServo: callPhysCb("setMotorLeft"),
  setXY: callPhysCb("setXY"),
  getUSDistance: channel => readUS[channel - 1](),
  getLineSensor: channel => readLine[channel - 1](),
  readButton: channel => readBtn[channel - 1](),
}

self.addEventListener("message", async function messageHandler(event) {
  if (event.data.id === "constructor") {
    port = event.data.data
    port.onmessage = messageHandler

    api = new API({
      onReady: () => sendMain({ id: "status", data: "ready" }),
      hostWrite,
      moduleCache: event.data.cache,
      hostCache: (name, module) => sendMain({ id: "cache", name, data: module }),
    })

    buffer = event.data.buffer
    dataView = new DataView(buffer)
  }

  if (event.data.id === "run_code") {
    sendMain({ id: "status", data: "running" })
    await api.compileLinkRun(event.data.data, imports)
    sendMain({ id: "status", data: "ready" })
  }
})
