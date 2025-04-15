import { API } from "./api.js"

let api
let port
let buffer, dataView
let currentOffset = 0
let lastCalls = {}

const sendMain = message => port.postMessage(message)
const sendPhys = message => port.postMessage({ id: "to_phys", message })

const callPhysCb = name => {
  return (...args) => {
    sendPhys({
      id: "call",
      name,
      args,
    })
  }
}

const readStateCb = (size, unsigned, float) => {
  const offset = currentOffset
  currentOffset += size
  if (float) return () => dataView[`getFloat${size * 8}`](offset)
  return () => dataView[`get${size === 8 ? "Big" : ""}${unsigned ? "Uint" : "Int"}${size * 8}`](offset)
}

const readTime = readStateCb(8, true)
const readUS = readStateCb(1, true)
const readLine = [readStateCb(2, true), readStateCb(2, true)]
const readAccelX = readStateCb(8, false, true)
const readAccelY = readStateCb(8, false, true)
const readGyroZ = readStateCb(8, false, true)

// функции, что будут доступны в коде C. Для использования нужно также их обозначить в .h файле
const imports = {
  setMotorLeft: callPhysCb("setMotorLeft"),
  setMotorRight: callPhysCb("setMotorRight"),
  setServoInternal: callPhysCb("setServo"),
  millis: () => readTime(),
  getUSDistance: readUS,
  getLineSensor: channel => readLine[channel - 1](),
  getAccelX: readAccelX,
  getAccelY: readAccelY,
  getGyroZ: readGyroZ,
}

self.addEventListener("message", async function messageHandler(event) {
  if (event.data.id === "constructor") {
    port = event.data.data
    port.onmessage = messageHandler

    api = new API({
      onReady: () => sendMain({ id: "status", data: "ready" }),
      hostWrite: msg => sendMain({ id: "write", data: msg }),
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
