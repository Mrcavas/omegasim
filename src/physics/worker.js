let port

const sendMain = message => port.postMessage(message)
const sendCpp = message => port.postMessage({ id: "to_cpp", message })

self.addEventListener("message", async function messageHandler(event) {
  if (event.data.id === "constructor") {
    port = event.data.data
    port.onmessage = messageHandler

    let start = Date.now();

    setInterval(() => {
      const now = Date.now()
      console.log(now - start)
      start = Date.now()

      sendCpp({
        id: "state_update",
        data: {
          testData: Math.random(),
        },
      })
    })
  }
})
