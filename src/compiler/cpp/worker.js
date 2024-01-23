import { API } from './api'

let api
let port
let imports = {
  millis: () => BigInt(Date.now()),
  alert: () => port.postMessage({ id: "alert" })
}
let result = null

let currentApp = null
// let time



const onAnyMessage = async (event) => {
  console.log(event.data.id)
  switch (event.data.id) {
    case 'constructor':
      port = event.data.data
      port.onmessage = onAnyMessage
      api = new API({
        hostWrite: msg => port.postMessage({
          id: "write",
          data: msg
        })
      })

      break

    case "callback":
      result = event.data.result
      console.log(result)
      break

    case "registerImport":
      imports = {
        ...imports,
        [event.data.name]: () => {
          port.postMessage({
            id: "call",
            name: event.data.name
          })

          // ждём ответ

          console.log("got result:", result)
          result = null

          return 10
        }
      }

      break

    case 'compileLinkRun':
      currentApp = await api.compileLinkRun(event.data.data, imports)
      console.log(`finished compileLinkRun. currentApp = ${currentApp}.`)
      break
  }
}

self.addEventListener('message', onAnyMessage)
