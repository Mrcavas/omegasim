import { engine, initMatter } from "./init.js"
import { Composite, Bodies } from "matter-js"

let port
export let canvas
export let context

export const sendMain = message => port.postMessage(message)
export const sendCpp = message => port.postMessage({ id: "to_cpp", message })

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
})