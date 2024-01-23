import { create } from "zustand"
import { persist } from "zustand/middleware"
import CppWorker from "./compiler/cpp/worker?worker"

const defaultCode = `#include <stdio.h>

extern "C" void alert();

int main() {
    
    printf("Hello, world from C++!");
    alert();

    return 0;
}`

export const useRunner = create(
  persist(
    (set, get) => ({
      worker: null,
      onWrite: console.log,
      setOnWrite: (onWrite) => set({ ...get(), onWrite }),
      clearLogs: () => {
      },
      setClearLogs: (clearLogs) => set({ ...get(), clearLogs }),
      code: defaultCode,
      setCode: (code) => set({ ...get(), code }),
      init() {
        set((state) => {
          const worker = new CppWorker()
          const messageChannel = new MessageChannel()

          worker.postMessage({ id: "constructor", data: messageChannel.port2 }, [messageChannel.port2])
          messageChannel.port1.onmessage = event => {
            if (event.data.id === "write") {
              const { onWrite } = get()
              onWrite(event.data.data)
            }
            if (event.data.id === "call") {
              const { imports } = get()
              messageChannel.port1.postMessage({
                id: "callback",
                result: imports[event.data.name]()
              })
              console.log("sent callback")
            }
            if (event.data.id === "alert") alert("а вот тут уже с++ запустил alert в браузере)")
          }

          return {
            ...state,
            worker: { messagePort: messageChannel.port1, worker },
          }
        })
      },
      restart() {
        const { worker, init } = get()
        worker.worker.terminate()
        init()
      },
      runCode() {
        const { code, worker } = get()
        worker.messagePort.postMessage({ id: "compileLinkRun", data: code })
      },
      imports: {},
      registerImport: (fn) => {
        const { worker } = get()
        worker.messagePort.postMessage({ id: "registerImport", name: fn.name })
        set((state) => ({
          ...state,
          imports: {
            ...state.imports,
            [fn.name]: fn
          }
        }))
      },
    }),
    { name: "runner-store", version: 2, blacklist: ["worker"] },
  ),
)