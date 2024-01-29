import { API } from "./api.js"

let api
let port

let state = {}

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

const getStateCB = statePath => channel => state[statePath][channel] ?? 0

const imports = {
  millis() {
    return BigInt(Date.now())
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
  getLineSensor: getStateCB("line"),
  getUSDistance: getStateCB("us"),
  readButton: getStateCB("btn"),
}

self.addEventListener("message", async function messageHandler(event) {
  if (event.data.id === "constructor") {
    port = event.data.data
    port.onmessage = messageHandler

    api = new API({ hostWrite })

    console.log("can use shared memory:", crossOriginIsolated)
  }

  if (event.data.id === "run_code") {
    api.compileLinkRun(event.data.data, imports)
  }

  if (event.data.id === "state_update") {
    // console.log("state update")
    state = {
      ...state,
      ...event.data.data,
    }
  }
})
