import { events, initMatter, restart, setCameraScale, setTimeScale } from "./main.js"

let port
let currentOffset = 0
let buffer, dataView
export let canvas
export let context

export const sendMain = message => port.postMessage(message)
export const hostLog = msg => sendMain({ id: "write", data: `\x1b[1;92m>\x1b[0m ${msg}\n` })
const updateStateCb = (size, unsigned) => {
  const offset = currentOffset
  currentOffset += size
  return value => dataView[`set${size === 8 ? "Big" : ""}${unsigned ? "Uint" : "Int"}${size * 8}`](offset, value)
}

export const updateTime = updateStateCb(8, true)
export const updateUS1 = updateStateCb(2, true)
export const updateUS2 = updateStateCb(2, true)
export const updateLine1 = updateStateCb(2, true)
export const updateLine2 = updateStateCb(2, true)
export const updateBtn1 = updateStateCb(1)
export const updateBtn2 = updateStateCb(1)
export const updateBtn3 = updateStateCb(1)

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

      initMatter()
    }

    if (event.data.id === "restart") {
      restart()
    }

    if (event.data.id === "canvas_resize") {
      canvas.width = event.data.width
      canvas.height = event.data.height
    }

    if (event.data.id === "call") {
      events.dispatchEvent(new CustomEvent(event.data.name, { detail: event.data.args }))
    }

    if (event.data.id === "time_scale") setTimeScale(event.data.data)
    if (event.data.id === "camera_scale") setCameraScale(event.data.data)
  })
}
