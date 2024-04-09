import { forwardRef, useImperativeHandle, useRef, useState } from "react"
import { useStore } from "../store.js"

export default forwardRef(function Canvas({ isPanning, setIsPanning, setCameraScale }, ref) {
  const phys = useStore(({ phys }) => phys)
  const canvasRef = useRef()
  const [movingOrigin, setMovingOrigin] = useState()
  const [pan, setPan] = useState({ x: 0, y: 0 })

  useImperativeHandle(
    ref,
    () => ({
      resetPan: () => setPan({ x: 0, y: 0 }),
      transferControlToOffscreen: () => canvasRef.current.transferControlToOffscreen(),
    }),
    []
  )

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={e => {
        if (!isPanning) {
          setIsPanning(true)
          setPan({ x: 0, y: 0 })
          phys.port.postMessage({
            id: "pan_change",
            isPanning: true,
            forced: true,
          })
        }
        setMovingOrigin({ x: e.pageX, y: e.pageY, panStart: pan })
      }}
      onMouseUp={() => setMovingOrigin()}
      onMouseMove={e => {
        if (movingOrigin) {
          const pan = {
            x: movingOrigin.panStart.x + e.pageX - movingOrigin.x,
            y: movingOrigin.panStart.y + e.pageY - movingOrigin.y,
          }
          setPan(pan)
          phys.port.postMessage({
            id: "pan_move",
            pan,
          })
        }
      }}
      onMouseLeave={() => setMovingOrigin()}
      onWheel={e => {
        setCameraScale(scale => Math.max(0, Math.min(100, scale - e.deltaY * 0.02)))
      }}
    />
  )
})
