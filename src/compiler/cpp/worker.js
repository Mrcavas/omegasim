import { API } from "./api"

let api
let port

let state

const sendMain = message => port.postMessage(message)
const sendPhys = message => port.postMessage({ id: "to_phys", message })

const imports = {
  millis: () => BigInt(Date.now()),
  getTestData: () => state.testData
}

self.addEventListener("message", async function messageHandler(event) {
  if (event.data.id === "constructor") {
    port = event.data.data
    port.onmessage = messageHandler

    api = new API({
      hostWrite: msg => sendMain({ id: "write", data: msg }),
    })
  }

  if (event.data.id === "run_code") {
    await api.compileLinkRun(event.data.data, imports)
  }

  if (event.data.id === "state_update") {
    state = event.data.data
  }
})
