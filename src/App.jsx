import { Splitter, SplitterPanel } from "primereact/splitter"
import { Button } from "primereact/button"
import { Slider } from "primereact/slider"
import "primereact/resources/themes/lara-dark-purple/theme.css"
import Editor from "./components/editor.jsx"
import { useRunner } from "./runner.js"
import { useEffect, useRef, useState } from "react"

import Logs from "./components/logs.jsx"
import Canvas from "./components/canvas.jsx"

export default function App() {
  const { init, runCode, clearLogs, restart, setOnStatus, phys } = useRunner(
    ({ init, runCode, clearLogs, restart, setOnStatus, phys }) => ({
      init,
      runCode,
      clearLogs,
      restart,
      setOnStatus,
      phys,
    })
  )

  const containerRef = useRef()
  const canvasRef = useRef()
  const [tab, setTab] = useState(0)
  const [status, setStatus] = useState("init")
  const [timeScale, setTimeScale] = useState(50)
  const [cameraScale, setCameraScale] = useState(50)
  const [isPanning, setIsPanning] = useState(false)

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

  useEffect(() => {
    let normalizedTimeScale = 1
    if (timeScale < 50) normalizedTimeScale = timeScale / 50
    if (timeScale > 50) normalizedTimeScale = (timeScale / 50) * 2 - 1
    if (!phys?.port) return
    phys.port.postMessage({
      id: "time_scale",
      data: normalizedTimeScale,
    })
  }, [timeScale])

  useEffect(() => {
    if (!phys?.port) return
    phys.port.postMessage({
      id: "camera_scale",
      data: 10 ** (cameraScale / 50 - 1),
    })
  }, [cameraScale])

  return (
    <Splitter className="h-full">
      <SplitterPanel className="overflow-hidden" size={25}>
        <Editor />
      </SplitterPanel>
      <SplitterPanel className="flex flex-col gap-2 p-2 overflow-hidden" size={75}>
        <div className="relative flex flex-row gap-2 justify-between">
          <Button
            icon={status !== "running" ? "pi pi-caret-right" : "pi pi-stop"}
            severity={status !== "running" ? "success" : "danger"}
            rounded
            text
            onClick={status !== "running" ? runCode : () => restart()}
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

          {tab === 1 ? (
            <Button icon="pi pi-times" severity="danger" rounded text className="ml-2" onClick={clearLogs} />
          ) : (
            <Button
              icon="pi pi-refresh rotate-45"
              severity="help"
              rounded
              text
              className="ml-2"
              onClick={() => restart("phys")}
            />
          )}
        </div>

        <div
          ref={containerRef}
          className={
            "h-full w-full rounded-md overflow-hidden " +
            (tab === 0 ? "relative" : "absolute h-0 w-0 opacity-0 pointer-events-none")
          }>
          <Canvas ref={canvasRef} {...{ isPanning, setIsPanning, setCameraScale }} />

          <Button
            icon="pi pi-map-marker"
            rounded
            severity="success"
            text={isPanning}
            className="absolute top-2 right-2 h-9 w-9"
            onClick={() => {
              setIsPanning(isPanning => {
                phys.port.postMessage({
                  id: "pan_change",
                  isPanning: !isPanning,
                  forced: false,
                })
                return !isPanning
              })
              canvasRef.current.resetPan()
            }}
          />
        </div>
        {tab === 0 && (
          <div className="w-full flex flex-row gap-5 items-center p-2">
            <div className="shrink-0">Time scale</div>
            <Slider
              value={timeScale}
              step={0.1}
              onChange={e => {
                if (22 < e.value && e.value < 28) return setTimeScale(25)
                if (47 < e.value && e.value < 53) return setTimeScale(50)
                if (72 < e.value && e.value < 78) return setTimeScale(75)
                setTimeScale(e.value)
              }}
              className="w-full"
            />
          </div>
        )}
        <Logs
          className={"flex flex-col-reverse " + (tab === 1 ? "" : "absolute h-0 w-0 opacity-0 pointer-events-none")}
        />
      </SplitterPanel>
    </Splitter>
  )
}
