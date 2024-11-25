import { Button } from "primereact/button"
import "primereact/resources/themes/lara-dark-purple/theme.css"
import { Slider } from "primereact/slider"
import { Splitter, SplitterPanel } from "primereact/splitter"
import { useEffect, useRef, useState } from "react"
import Editor from "./components/editor.jsx"
import { useStore } from "./store.js"

import { Tooltip } from "primereact/tooltip"
import Canvas from "./components/canvas.jsx"
import Logs from "./components/logs.jsx"

export default function App({ id }) {
  const { init, runCode, clearLogs, restart, setOnStatus, setOnSlowSpeed, phys } = useStore(
    ({ init, runCode, clearLogs, restart, setOnStatus, setOnSlowSpeed, phys }) => ({
      init,
      runCode,
      clearLogs,
      restart,
      setOnStatus,
      setOnSlowSpeed,
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
  const [speed, setSpeed] = useState(1)
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    init(canvasRef.current, id)
    setOnStatus(setStatus)
    let lastDisableHandle
    setOnSlowSpeed(() => {
      setShowWarning(true)
      clearTimeout(lastDisableHandle)
      lastDisableHandle = setTimeout(() => {
        setShowWarning(false)
      }, 1000)
    })
    const port = useStore.getState().phys.port
    new ResizeObserver(() => {
      port.postMessage({
        id: "canvas_resize",
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      })
    }).observe(containerRef.current)
  }, [])

  useEffect(() => {
    if (!phys?.port) return
    let normalizedTimeScale = 1
    if (timeScale < 50) normalizedTimeScale = timeScale / 50
    if (timeScale > 50) normalizedTimeScale = ((timeScale - 50) / 50) * 4 + 1
    setSpeed(normalizedTimeScale)
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
      <SplitterPanel className="overflow-hidden" size={35}>
        <Editor id={id} />
      </SplitterPanel>
      <SplitterPanel className="flex flex-col gap-2 p-2 overflow-hidden" size={65}>
        <div className="relative flex flex-row gap-2 justify-between">
          <Button
            icon={status !== "running" ? "pi pi-caret-right" : "pi pi-stop"}
            severity={status !== "running" ? "success" : "danger"}
            rounded
            text
            onClick={
              status !== "running"
                ? () => runCode(id)
                : () => {
                    restart()
                    restart("phys")
                  }
            }
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
            <div className="shrink-0">Скорость времени</div>
            <Slider
              value={timeScale}
              step={0.1}
              onChange={e => {
                if (e.value < 3) return setTimeScale(0)
                if (22 < e.value && e.value < 28) return setTimeScale(25)
                if (47 < e.value && e.value < 53) return setTimeScale(50)
                if (59.5 < e.value && e.value < 65.5) return setTimeScale(62.5)
                if (72 < e.value && e.value < 78) return setTimeScale(75)
                if (84.5 < e.value && e.value < 90.5) return setTimeScale(87.5)
                if (e.value > 97) return setTimeScale(100)
                setTimeScale(e.value)
              }}
              className="w-full"
            />
            <div className="shrink-0 w-12 overflow-hidden grid place-items-center">
              {showWarning && status === "running" ? (
                <>
                  <div
                    data-pr-position="left"
                    data-pr-at="left-5 center"
                    data-pr-my="right center"
                    className="warning-sign pi pi-exclamation-triangle text-[#f87171]"
                  />
                  <Tooltip target=".warning-sign">
                    Симуляция может быть нестабильна! Возможно стоит уменьшить скорость
                  </Tooltip>
                </>
              ) : (
                <div>{speed.toFixed(2)}</div>
              )}
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
