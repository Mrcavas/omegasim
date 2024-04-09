import { create } from "zustand"
import { persist } from "zustand/middleware"
import CppWorker from "./compiler/worker.js?worker"
import PhysWorker from "./physics/worker?worker"

const defaultCode = [`#include <Omega.h>

int main() {
  while (true) {  
    auto liner1 = getLineSensor(1);
    auto liner2 = getLineSensor(2);

    auto liner1OnLine = liner1 >= 540;
    auto liner2OnLine = liner2 >= 540;

    if (!liner1OnLine && !liner2OnLine) {
      setMotors(90, 90);
    }
    if (liner1OnLine && !liner2OnLine) {
      setMotors(230, -127);
    }
    if (!liner1OnLine && liner2OnLine) {
      setMotors(-127, 230);
    }
    
    tick();  
  }

  return 0;
}`, `#include <Omega.h>

int main() {
  while (true) {
    tick(); 
  }

  return 0;
}`, `#include <Omega.h>

int main() {
  while (true) {
    tick(); 
  }

  return 0;
}`]

const messageHandler = (set, get) => event => {
  if (!get()) return
  const { cpp, phys, onWrite, onStatus, onSlowSpeed } = get()

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

  if (event.data.id === "start_timer") {
    const start = Date.now()
    setInterval(() => console.log(`time: ${Date.now() - start}`), 1000)
  }

  if (event.data.id === "slow_speed") onSlowSpeed()
}

export const useStore = create(
  persist(
    (set, get) => ({
      cpp: null,
      phys: null,
      onWrite: null,
      setOnWrite: onWrite => set({ ...get(), onWrite }),
      onStatus: null,
      setOnStatus: onStatus => set({ ...get(), onStatus }),
      onSlowSpeed: null,
      setOnSlowSpeed: onSlowSpeed => set({ ...get(), onSlowSpeed }),
      clearLogs: null,
      setClearLogs: clearLogs => set({ ...get(), clearLogs }),
      code: defaultCode,
      setCode: (id, newCode) => set(state => {
        state.code[id] = newCode
        return { ...state }
      }),
      sharedBuffer: null,
      moduleCache: {},
      initPhys(canvas, levelId) {
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
              levelId
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
      init(canvas, levelId) {
        // eslint-disable-next-line no-undef
        console.log("can use shared memory:", crossOriginIsolated)
        const { initPhys, initCpp, onWrite } = get()

        set(state => ({
          ...state,
          sharedBuffer: new SharedArrayBuffer(46),
        }))

        onWrite(`\x1b[1;92m>\x1b[0m Initializing Physics Engine (powered by Matter.js)\n`)
        initPhys(canvas, levelId)
        initCpp()
      },
      restart(type) {
        const { phys, cpp, initCpp, onStatus, onWrite } = get()

        if (type === "phys") {
          onWrite(`\x1b[1;92m>\x1b[0m Initializing Physics Engine (powered by Matter.js)\n`)
          phys.port.postMessage({ id: "restart" })
        }

        onStatus("init")
        cpp.worker.terminate()
        cpp.port.close()
        initCpp()
      },
      runCode(id) {
        const { code, cpp } = get()
        cpp.port.postMessage({ id: "run_code", data: code[id] })
      },
    }),
    {
      name: "omegasim",
      version: 15,
      partialize: state => ({ code: state.code }),
    }
  )
)
