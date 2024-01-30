import { Splitter, SplitterPanel } from "primereact/splitter"
import { Button } from "primereact/button"
import { Slider } from "primereact/slider"
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
  const [physPort, setPhysPort] = useState()
  const [timeScale, setTimeScale] = useState(50)
  const [cameraScale, setCameraScale] = useState(50)
  const [isFollowing, setFollowing] = useState(true)

  useEffect(() => {
    init(canvasRef.current)
    setOnStatus(setStatus)
    const port = useRunner.getState().phys.port
    setPhysPort(port)
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
    if (physPort)
      physPort.postMessage({
        id: "time_scale",
        data: normalizedTimeScale,
      })
  }, [timeScale])

  useEffect(() => {
    if (physPort)
      physPort.postMessage({
        id: "camera_scale",
        data: 10 ** (cameraScale / 50 - 1),
      })
  }, [cameraScale])

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
            (tab === 0 ? "" : "absolute h-0 w-0 opacity-0 pointer-events-none")
          }>
          <canvas ref={canvasRef} />
        </div>
        {tab === 0 && (
          <div className="flex flex-col gap-3 p-2">
            <div className="w-full flex flex-row gap-3 items-center">
              <div className="shrink-0 mr-2">Camera scale</div>
              <Slider
                value={cameraScale}
                step={0.1}
                onChange={e => setCameraScale(47 < e.value && e.value < 53 ? 50 : e.value)}
                className="w-full"
              />
              {/*<Button*/}
              {/*  icon="pi"*/}
              {/*  rounded*/}
              {/*  text={!isFollowing}*/}
              {/*  className="ml-2 shrink-0 h-8 w-8"*/}
              {/*  onClick={() => setFollowing(v => !v)}*/}
              {/*/>*/}
            </div>
            <div className="w-full flex flex-row gap-5 items-center">
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
          </div>
        )}
        <Logs
          className={"flex flex-col-reverse " + (tab === 1 ? "" : "absolute h-0 w-0 opacity-0 pointer-events-none")}
        />
      </SplitterPanel>
    </Splitter>
  )
}
