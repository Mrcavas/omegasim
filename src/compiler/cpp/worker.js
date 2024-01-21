import { API } from './api'

let api
let port

let currentApp = null

const onAnyMessage = async (event) => {
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

    case 'compileLinkRun':
      currentApp = await api.compileLinkRun(event.data.data)
      console.log(`finished compileLinkRun. currentApp = ${currentApp}.`)
      break
  }
}

self.addEventListener('message', onAnyMessage)
