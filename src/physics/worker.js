import { events, initMatter, restart, setCameraScale, setTimeScale } from "./main.js"

let port
let currentOffset = 0
let buffer, dataView
export let canvas
export let context

export const sendMain = message => port.postMessage(message)
export const hostLog = msg => sendMain({ id: "write", data: `\x1b[1;92m>\x1b[0m ${msg}\n` })
const updateStateCb = (size, unsigned, float) => {
  const offset = currentOffset
  currentOffset += size
  if (float) return value => dataView[`setFloat${size * 8}`](offset, value)
  return value => dataView[`set${size === 8 ? "Big" : ""}${unsigned ? "Uint" : "Int"}${size * 8}`](offset, value)
}

export const updateTime = updateStateCb(8, true)
export const updateUS = updateStateCb(1, true)
export const updateLine1 = updateStateCb(2, true)
export const updateLine2 = updateStateCb(2, true)
export const updateAccelX = updateStateCb(8, false, true)
export const updateAccelY = updateStateCb(8, false, true)
export const updateGyroZ = updateStateCb(8, false, true)


if (!self.isInitialized) {
  self.isInitialized = true
  self.addEventListener("message", async function messageHandler(event) {
    if (event.data.id === "constructor") {
      port = event.data.data
      port.onmessage = messageHandler

      canvas = event.data.canvas
      canvas.style = {}
      context = canvas.getContext("2d")

      buffer = event.data.buffer
      dataView = new DataView(buffer)

      initMatter(event.data.levelId)
    }

    if (event.data.id === "restart") restart()

    if (event.data.id === "canvas_resize") {
      canvas.width = event.data.width
      canvas.height = event.data.height
    }

    if (event.data.id === "pan_change") {
      events.dispatchEvent(new CustomEvent("pan_change", { detail: [event.data.isPanning, event.data.forced] }))
    }

    if (event.data.id === "pan_move") {
      events.dispatchEvent(new CustomEvent("pan_move", { detail: [event.data.pan] }))
    }

    if (event.data.id === "call") {
      events.dispatchEvent(new CustomEvent(event.data.name, { detail: event.data.args }))
    }

    if (event.data.id === "time_scale") setTimeScale(event.data.data)
    if (event.data.id === "camera_scale") setCameraScale(event.data.data)
  })
}
