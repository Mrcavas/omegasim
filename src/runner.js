import { create } from "zustand"
import { persist } from "zustand/middleware"
import CppWorker from "./compiler/worker.js?worker"
import PhysWorker from "./physics/worker?worker"

// const defaultCode = `#include <Omega.h>
//
// void loop() {
//     printf("diff: %lld\\n", millis() - getUSDistance(1));
// }
//
// void setup() {
//     printf("setup\\n");
// }`\

const defaultCode = `#include <Omega.h>

int main() {
    while (true) {
        printf("diff: %lld\\n", millis() - getUSDistance(1));
        delay(50);
    }

    return 0;
}`

const messageHandler = get => event => {
  if (!get()) return
  const { cpp, phys, onWrite } = get()

  if (event.data.id === "to_phys") {
    phys.port.postMessage(event.data.message)
  }

  if (event.data.id === "to_cpp") {
    cpp.port.postMessage(event.data.message)
  }

  if (event.data.id === "write") {
    onWrite(event.data.data)
  }
}

export const useRunner = create(
  persist(
    (set, get) => ({
      cpp: null,
      phys: null,
      onWrite: console.log,
      setOnWrite: onWrite => set({ ...get(), onWrite }),
      clearLogs: null,
      setClearLogs: clearLogs => set({ ...get(), clearLogs }),
      code: defaultCode,
      setCode: code => set({ ...get(), code }),
      initPhys(canvas) {
        set(state => {
          if (window.physInit) return
          const phys = new PhysWorker()
          const physChannel = new MessageChannel()

          const offscreenCanvas = canvas.transferControlToOffscreen()

          phys.postMessage(
            {
              id: "constructor",
              data: physChannel.port2,
              canvas: offscreenCanvas,
            },
            [physChannel.port2, offscreenCanvas]
          )
          physChannel.port1.onmessage = messageHandler(get)

          window.physInit = true

          return {
            ...state,
            phys: { port: physChannel.port1, worker: phys },
          }
        })
      },
      initCpp() {
        set(state => {
          const cpp = new CppWorker()
          const cppChannel = new MessageChannel()

          cpp.postMessage({ id: "constructor", data: cppChannel.port2 }, [cppChannel.port2])
          cppChannel.port1.onmessage = messageHandler(get)

          return {
            ...state,
            cpp: { port: cppChannel.port1, worker: cpp },
          }
        })
      },
      init(canvas) {
        const { initPhys, initCpp } = get()
        initPhys(canvas)
        initCpp()
      },
      restart() {
        const { cpp, initCpp } = get()
        cpp.worker.terminate()
        cpp.port.close()
        initCpp()
      },
      runCode() {
        const { code, cpp } = get()
        cpp.port.postMessage({ id: "run_code", data: code })
      },
    }),
    { name: "runner-store", version: 7, blacklist: ["cpp", "phys"] }
  )
)
