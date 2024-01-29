import { API } from "./api.js"

let api
let port

let state

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

const imports = {
  millis() {
    BigInt(Date.now())
  },
  delay(ms) {
    const start = Date.now()
    while (Date.now() - start < ms) {
      /* wait */
    }
  },
  setMotorLeft: callPhysCb("setMotorLeft"),
  setMotorRight: callPhysCb("setMotorLeft"),
  setLed: callPhysCb("setLed"),
  setServo: callPhysCb("setMotorLeft"),
}

self.addEventListener("message", async function messageHandler(event) {
  if (event.data.id === "constructor") {
    port = event.data.data
    port.onmessage = messageHandler

    api = new API({ hostWrite })

    sendPhys("hello from cpp")
  }

  if (event.data.id === "run_code") {
    await api.compileLinkRun(event.data.data, imports)
  }

  if (event.data.id === "state_update") {
    state = {
      ...state,
      ...event.data.data,
    }
  }
})
