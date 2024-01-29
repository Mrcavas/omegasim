import { engine, events, initMatter } from "./init.js"
import { Bodies, Composite } from "matter-js"

let port
export let canvas
export let context

export const sendMain = message => port.postMessage(message)
export const sendCpp = message => port.postMessage({ id: "to_cpp", message })
export const hostLog = msg => sendMain({ id: "write", data: `\x1b[1;92m>\x1b[0m ${msg}\n` })

if (!self.isInitialized) {
  self.isInitialized = true
  self.addEventListener("message", async function messageHandler(event) {
    if (event.data.id === "constructor") {
      port = event.data.data
      port.onmessage = messageHandler

      canvas = event.data.canvas
      context = canvas.getContext("2d")

      initMatter()
    }

    if (event.data.id === "canvas_resize") {
      canvas.width = event.data.width
      canvas.height = event.data.height
    }

    if (event.data.id === "rectangle") {
      Composite.add(engine.world, Bodies.rectangle(...event.data.args))
    }

    if (event.data.id === "call") {
      events.dispatchEvent(new CustomEvent(event.data.name, { detail: event.data.args }))
    }
  })
}
