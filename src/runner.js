import { create } from "zustand"
import { persist } from "zustand/middleware"
import CppWorker from "./compiler/worker.js?worker"
import PhysWorker from "./physics/worker?worker"

const defaultCode = `#include <Omega.h>

float a = 0;

int main() {
    auto start = millis();

    while (true) {
        a = (millis() - start) * 0.001;
        int16_t x = cos(a) * 200;
        int16_t y = sin(2 * a) * 100;

        setXY(x, y);
        delay(1);
    }

    return 0;
}`

const messageHandler = (set, get) => event => {
  if (!get()) return
  const { cpp, phys, onWrite, onStatus } = get()

  if (event.data.id === "to_phys") phys.port.postMessage(event.data.message)

  if (event.data.id === "to_cpp") cpp.port.postMessage(event.data.message)

  if (event.data.id === "write") onWrite(event.data.data)

  if (event.data.id === "status") onStatus(event.data.data)

  if (event.data.id === "cache")
    set(state => ({
      ...state,
      moduleCache: {
        ...state.moduleCache,
        [event.data.name]: event.data.data,
      },
    }))
}

export const useRunner = create(
  persist(
    (set, get) => ({
      cpp: null,
      phys: null,
      onWrite: null,
      setOnWrite: onWrite => set({ ...get(), onWrite }),
      onStatus: null,
      setOnStatus: onStatus => set({ ...get(), onStatus }),
      clearLogs: null,
      setClearLogs: clearLogs => set({ ...get(), clearLogs }),
      code: defaultCode,
      setCode: code => set({ ...get(), code }),
      sharedBuffer: null,
      moduleCache: {},
      initPhys(canvas) {
        set(state => {
          const phys = new PhysWorker()
          const physChannel = new MessageChannel()

          const offscreenCanvas = canvas.transferControlToOffscreen()

          phys.postMessage(
            {
              id: "constructor",
              data: physChannel.port2,
              canvas: offscreenCanvas,
              buffer: state.sharedBuffer,
            },
            [physChannel.port2, offscreenCanvas]
          )
          physChannel.port1.onmessage = messageHandler(set, get)

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

          cpp.postMessage(
            { id: "constructor", data: cppChannel.port2, buffer: state.sharedBuffer, cache: state.moduleCache },
            [cppChannel.port2]
          )
          cppChannel.port1.onmessage = messageHandler(set, get)

          return {
            ...state,
            cpp: { port: cppChannel.port1, worker: cpp },
          }
        })
      },
      init(canvas) {
        // eslint-disable-next-line no-undef
        console.log("can use shared memory:", crossOriginIsolated)
        const { initPhys, initCpp } = get()

        set(state => ({
          ...state,
          sharedBuffer: new SharedArrayBuffer(23),
        }))

        initPhys(canvas)
        initCpp()
      },
      restart() {
        const { cpp, initCpp, onStatus } = get()
        onStatus("init")
        cpp.worker.terminate()
        cpp.port.close()
        initCpp()
      },
      runCode() {
        const { code, cpp } = get()
        cpp.port.postMessage({ id: "run_code", data: code })
      },
    }),
    {
      name: "runner-store",
      version: 8,
      partialize: state => ({ code: state.code }),
    }
  )
)
