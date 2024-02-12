import { API } from "./api.js"

let api
let port
let buffer, dataView
let currentOffset = 0

const sendMain = message => port.postMessage(message)
const sendPhys = message => port.postMessage({ id: "to_phys", message })
const hostWrite = msg => sendMain({ id: "write", data: msg })

let lastCalls = {}

const callPhysCb = name => {
  return (...args) => {
    if (performance.now() - (lastCalls[name] ?? 0) < 4) return
    lastCalls[name] = performance.now()
    sendPhys({
      id: "call",
      name,
      args,
    })
  }
}

const readStateCb = (size, unsigned) => {
  const offset = currentOffset
  currentOffset += size
  return () => dataView[`get${size === 8 ? "Big" : ""}${unsigned ? "Uint" : "Int"}${size * 8}`](offset)
}

const readTime = readStateCb(8, true)
const readUS = [readStateCb(2, true), readStateCb(2, true)]
const readLine = [readStateCb(2, true), readStateCb(2, true)]
const readBtn = [readStateCb(1), readStateCb(1), readStateCb(1)]

const imports = {
  setMotorLeft: callPhysCb("setMotorLeft"),
  setMotorRight: callPhysCb("setMotorRight"),
  setLed: callPhysCb("setLed"),
  setServo: callPhysCb("setServo"),
  millis: () => readTime(),
  getUSDistance: channel => readUS[channel - 1](),
  getLineSensor: channel => Math.max(0, Math.min(1, ((readLine[channel - 1]() - 200) / 700 - 0.15) / 0.7)),
  readButton: channel => readBtn[channel - 1](),
  startTimer: () => sendMain({ id: "start_timer" }),
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
