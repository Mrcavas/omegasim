import { create } from "zustand"
import { persist } from "zustand/middleware"
import CppWorker from './compiler/cpp/worker?worker'

const defaultCode = `#include <stdio.h>

int main() {
    printf("Hello, C++!");
    return 0;
}`

export const useRunner = create(
  persist(
    (set, get) => ({
      worker: null,
      onWrite: console.log,
      setOnWrite: (onWrite) => set({ ...get(), onWrite}),
      clearLogs: () => {},
      setClearLogs: (clearLogs) => set({ ...get(), clearLogs}),
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
          }

          return {
            ...state,
            worker: { messagePort: messageChannel.port1, worker }
          }
        })
      },
      runCode() {
        const { code, worker } = get()
        worker.messagePort.postMessage({ id: "compileLinkRun", data: code })
      },
    }),
    { name: "runner-store", version: 2, blacklist: ["worker"] },
  ),
)