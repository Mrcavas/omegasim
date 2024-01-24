import { create } from "zustand"
import { persist } from "zustand/middleware"
import CppWorker from "./compiler/cpp/worker?worker"
import PhysWorker from "./physics/worker?worker"

const defaultCode = `#include <stdio.h>

extern "C" void addRectangle(int x, int y, int w, int h);

extern "C" uint64_t millis();

int main() {
    uint64_t start = millis();

    while (true) {
        while (millis() - start < 1000) printf("");

        addRectangle(
            400, 200, 80, 80
        );

        start = millis();
    }

    return 0;
}`

export const useRunner = create(
  persist(
    (set, get) => ({
      cpp: null,
      phys: null,
      onWrite: console.log,
      setOnWrite: (onWrite) => set({ ...get(), onWrite }),
      clearLogs: null,
      setClearLogs: (clearLogs) => set({ ...get(), clearLogs }),
      code: defaultCode,
      setCode: (code) => set({ ...get(), code }),
      init(canvas, initResizeHandler) {
        set((state) => {
          const cpp = new CppWorker()
          const cppChannel = new MessageChannel()

          const phys = new PhysWorker()
          const physChannel = new MessageChannel()

          cpp.postMessage({ id: "constructor", data: cppChannel.port2 }, [cppChannel.port2])

          const offscreenCanvas = canvas.transferControlToOffscreen()

          phys.postMessage({
            id: "constructor",
            data: physChannel.port2,
            canvas: offscreenCanvas,
          }, [physChannel.port2, offscreenCanvas])

          const messageHandler = event => {
            if (event.data.id === "to_phys") {
              physChannel.port1.postMessage(event.data.message)
            }

            if (event.data.id === "to_cpp") {
              cppChannel.port1.postMessage(event.data.message)
            }

            if (event.data.id === "write") {
              const { onWrite } = get()
              onWrite(event.data.data)
            }
          }

          cppChannel.port1.onmessage = messageHandler
          physChannel.port1.onmessage = messageHandler

          return {
            ...state,
            cpp: { port: cppChannel.port1, worker: cpp },
            phys: { port: physChannel.port1, worker: phys },
          }
        })
      },
      restart() {
        const { cpp, init } = get()
        cpp.worker.terminate()
        init()
      },
      runCode() {
        const { code, cpp } = get()
        cpp.port.postMessage({ id: "run_code", data: code })
      },
    }),
    { name: "runner-store", version: 3, blacklist: ["cpp", "phys"] },
  ),
)