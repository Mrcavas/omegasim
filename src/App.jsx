import { Splitter, SplitterPanel } from "primereact/splitter"
import { Button } from "primereact/button"
import "primereact/resources/themes/lara-dark-purple/theme.css"
import Editor from "./components/editor.jsx"
import { useRunner } from "./runner.js"
import { useEffect, useRef } from "react"

import clang from "./compiler/assets/clang.wasm?url"
import lld from "./compiler/assets/lld.wasm?url"
import memfs from "./compiler/assets/memfs.wasm?url"
import sysroot from "./compiler/assets/sysroot.tar?url"
import Logs from "./components/logs.jsx"

console.log({ clang, lld, memfs, sysroot })
export default function App() {
  const { init, runCode, clearLogs, restart } = useRunner(({ init, runCode, clearLogs, restart }) => ({
    init, runCode, clearLogs, restart
  }))

  const containerRef = useRef()
  const canvasRef = useRef()

  useEffect(() => {
    init(canvasRef.current)
    const port = useRunner.getState().phys.port
    new ResizeObserver(() => {
      port.postMessage({
        id: "canvas_resize",
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight
      })
    }).observe(containerRef.current)
  }, [])

  return (
    <Splitter className="h-full">
      <SplitterPanel className="overflow-hidden" size={40}>
        <Editor />
      </SplitterPanel>
      <SplitterPanel className="flex flex-col gap-2 p-2 overflow-hidden" size={60}>
        <div className="flex flex-row gap-2 justify-between">
          <Button icon="pi pi-caret-right" severity="success" rounded text onClick={runCode} />
          <div>
            <Button icon="pi pi-refresh rotate-45" severity="help" rounded text onClick={restart} />
            <Button icon="pi pi-times" severity="danger" rounded text onClick={clearLogs} />
          </div>
        </div>
        <div ref={containerRef} className="h-full w-full rounded-md overflow-hidden">
          <canvas ref={canvasRef}/>
        </div>
        {/*<Logs className="flex flex-col-reverse" />*/}
      </SplitterPanel>
    </Splitter>
  )
}