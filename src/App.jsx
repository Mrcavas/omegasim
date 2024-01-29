import { Splitter, SplitterPanel } from "primereact/splitter"
import { Button } from "primereact/button"
import "primereact/resources/themes/lara-dark-purple/theme.css"
import Editor from "./components/editor.jsx"
import { useRunner } from "./runner.js"
import { useEffect, useRef, useState } from "react"

import Logs from "./components/logs.jsx"

export default function App() {
  const { init, runCode, clearLogs, restart, setOnStatus } = useRunner(
    ({ init, runCode, clearLogs, restart, setOnStatus }) => ({
      init,
      runCode,
      clearLogs,
      restart,
      setOnStatus,
    })
  )

  const containerRef = useRef()
  const canvasRef = useRef()
  const [tab, setTab] = useState(0)
  const [status, setStatus] = useState("init")

  useEffect(() => {
    init(canvasRef.current)
    setOnStatus(setStatus)
    const port = useRunner.getState().phys.port
    new ResizeObserver(() => {
      port.postMessage({
        id: "canvas_resize",
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      })
    }).observe(containerRef.current)
  }, [])

  return (
    <Splitter className="h-full">
      <SplitterPanel className="overflow-hidden" size={40}>
        <Editor />
      </SplitterPanel>
      <SplitterPanel className="flex flex-col gap-2 p-2 overflow-hidden" size={60}>
        <div className="relative flex flex-row gap-2 justify-between">
          <Button
            icon={status !== "running" ? "pi pi-caret-right" : "pi pi-stop"}
            severity={status !== "running" ? "success" : "danger"}
            rounded
            text
            onClick={status !== "running" ? runCode : restart}
            disabled={status === "init"}
          />

          <div className="absolute left-1/2 -translate-x-1/2">
            <Button
              icon="pi pi-bolt"
              severity="warning"
              rounded
              text={tab !== 0}
              onClick={() => {
                setTab(0)
              }}
            />
            <Button
              icon="pi pi-align-right rotate-180"
              severity="info"
              rounded
              text={tab !== 1}
              className="ml-2"
              onClick={() => {
                setTab(1)
              }}
            />
          </div>

          {tab === 1 && (
            <Button icon="pi pi-times" severity="danger" rounded text className="ml-2" onClick={clearLogs} />
          )}
        </div>

        <div ref={containerRef} className={"h-full w-full rounded-md overflow-hidden " + (tab === 0 ? "" : "hidden")}>
          <canvas ref={canvasRef} />
        </div>
        <Logs className={"flex flex-col-reverse " + (tab === 1 ? "" : "hidden")} />
      </SplitterPanel>
    </Splitter>
  )
}
