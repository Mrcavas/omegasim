let port
let canvas, context

const sendMain = message => port.postMessage(message)
const sendCpp = message => port.postMessage({ id: "to_cpp", message })

self.addEventListener("message", async function messageHandler(event) {
  if (event.data.id === "constructor") {
    port = event.data.data
    port.onmessage = messageHandler

    canvas = event.data.canvas
    context = canvas.getContext("2d")
  }

  if (event.data.id === "canvas_resize") {
    canvas.width = event.data.width
    canvas.height = event.data.height

    context.fillStyle = "red"
    context.fillRect(0, 0, canvas.width, canvas.height)
  }
})
