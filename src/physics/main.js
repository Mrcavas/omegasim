import { Bodies, Composite, Engine, Events, Runner } from "matter-js"
import { canvas, context, sendMain, updateTime } from "./worker.js"
import { body, m, PI, PX2M, v } from "./utils.js"
import { afterTick, resetForces, tick } from "./tick.js"
import car_png from "/car.png?url"
import line_png from "/line.png?url"
import Liner from "./sensors/liner.js"

let frameHandle
let vectorsForRender = []
export let engine
let cameraScale = 1,
  timeScale = 1
let panX, panY, startPan
export let car

let car_img
fetch(car_png)
  .then(res => res.blob())
  .then(blob => createImageBitmap(blob))
  .then(img => (car_img = img))

let line_img
fetch(line_png)
  .then(res => res.blob())
  .then(blob => createImageBitmap(blob))
  .then(img => (line_img = img))

export const events = new EventTarget()
const listeners = []
export const addListener = (name, cb) => {
  events.addEventListener(name, e => cb(...e.detail))
  listeners.push({ name, cb })
}
const removeListeners = () => listeners.forEach(({ name, cb }) => events.removeEventListener(name, cb))

let runnerHandle, tickCounterHandle

export const wheelFrontOffset = 0.02
export const wheelSideOffset = 0.0125
export const wheelDiameter = 0.065
export const carWidth = 0.123
export const carLength = 0.22

export const lineSize = m(1.015, 1.015)
export const linePosition = m(-1.015 * 0.75 + carLength / 2, -1.015 + 0.025 / 2)
// export const lineSize = m(1.075, 3.025) // old
// export const linePosition = m(-1.075 / 2, -3.025 + 0.025 / 2) // old
// export const linePosition = m(-0.15, -3.025 + 0.025 / 2)
// export const linePosition = v(-753, -7240)
export const linePositionMargined = linePosition.add(m(-0.003, -0.003))

export const k = () => PX2M * 500 * cameraScale

export const offsetX = () => panX ?? canvas.width / 2 - car.position.x * k()
export const offsetY = () => panY ?? canvas.height / 2 - car.position.y * k()

const carVertices = [
  m(carWidth, 0),
  m(carWidth, wheelFrontOffset),
  m(carWidth + wheelSideOffset, wheelFrontOffset),
  m(carWidth + wheelSideOffset, wheelFrontOffset + wheelDiameter),
  m(carWidth, wheelFrontOffset + wheelDiameter),
  m(carWidth, carLength - (wheelFrontOffset + wheelDiameter)),
  m(carWidth + wheelSideOffset, carLength - (wheelFrontOffset + wheelDiameter)),
  m(carWidth + wheelSideOffset, carLength - wheelFrontOffset),
  m(carWidth, carLength - wheelFrontOffset),
  m(carWidth, carLength),
  m(0, carLength),
  m(0, carLength - wheelFrontOffset),
  m(-wheelSideOffset, carLength - wheelFrontOffset),
  m(-wheelSideOffset, carLength - (wheelFrontOffset + wheelDiameter)),
  m(0, carLength - (wheelFrontOffset + wheelDiameter)),
  m(-wheelSideOffset, wheelFrontOffset),
  m(-wheelSideOffset, wheelFrontOffset + wheelDiameter),
  m(0, wheelFrontOffset + wheelDiameter),
  m(0, wheelFrontOffset),
  m(0, 0),
]

export function initMatter() {
  engine = Engine.create({
    gravity: {
      y: 0,
    },
    timing: {
      timeScale,
    },
  })

  car = body(
    Bodies.fromVertices(0, 0, carVertices, {
      friction: 0,
      frictionAir: 0.22,
      frictionStatic: 0,
    })
  )

  car.setAngle(PI * 1.5)

  car.slots = {
    1: new Liner(1, car, 1),
    2: new Liner(2, car, 2),
    3: null,
    4: null,
  }

  const centerX = carWidth / 2
  const centerY = carLength / 2

  const partOffsetX = wheelSideOffset / 2 - centerX
  const partOffsetY = wheelDiameter / 2 - centerY

  car.setParts([
    Bodies.rectangle(0, 0, m(carWidth), m(carLength)),
    Bodies.rectangle(
      m(-wheelSideOffset + partOffsetX),
      m(wheelFrontOffset + partOffsetY),
      m(wheelSideOffset),
      m(wheelDiameter)
    ),
    Bodies.rectangle(
      m(carWidth + partOffsetX),
      m(wheelFrontOffset + partOffsetY),
      m(wheelSideOffset),
      m(wheelDiameter)
    ),
    Bodies.rectangle(
      m(-wheelSideOffset + partOffsetX),
      m(carLength - wheelFrontOffset - wheelDiameter + partOffsetY),
      m(wheelSideOffset),
      m(wheelDiameter)
    ),
    Bodies.rectangle(
      m(carWidth + partOffsetX),
      m(carLength - wheelFrontOffset - wheelDiameter + partOffsetY),
      m(wheelSideOffset),
      m(wheelDiameter)
    ),
  ])

  car.setMass(m(0.858))

  Composite.addBody(engine.world, car)

  addListener("pan_change", (isPanning, forced) => {
    if (isPanning) {
      if (forced || !startPan)
        startPan = {
          x: canvas.width / 2 - car.position.x * k(),
          y: canvas.height / 2 - car.position.y * k(),
        }
      panX = startPan?.x
      panY = startPan?.y
    } else {
      startPan = { x: panX, y: panY }
      panX = undefined
      panY = undefined
    }
  })

  addListener("pan_move", ({ x, y }) => {
    panX = startPan.x + x
    panY = startPan.y + y
  })

  vectorsForRender = []
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = "high"
  render()

  let lastTick = performance.now()
  let slowTicks = 0

  tickCounterHandle = setInterval(() => {
    if (slowTicks > 3) sendMain({ id: "slow_speed" })
    slowTicks = 0
  }, 500)

  runnerHandle = setInterval(() => {
    const now = performance.now()
    const delta = now - lastTick
    lastTick = now
    if (delta * timeScale > 33.3) slowTicks += 1

    // vectorsForRender = []
    updateTime(BigInt(Math.trunc(engine.timing.timestamp)))
    tick(delta, engine.timing.timestamp)
    Engine.update(engine, delta)
    // afterTick(delta, engine.timing.timestamp)
  })
}

export const renderVector = (pos, vec) => vectorsForRender.push({ pos, vec: vec })

function render() {
  frameHandle = requestAnimationFrame(render)

  const bodies = Composite.allBodies(engine.world)

  context.fillStyle = "#111111"
  context.fillRect(0, 0, canvas.width, canvas.height)

  if (line_img) {
    context.drawImage(
      line_img,
      linePosition.x * k() + offsetX(),
      linePosition.y * k() + offsetY(),
      lineSize.x * k(),
      lineSize.y * k()
    )
  }

  // context.beginPath()

  for (let i = 0; i < bodies.length; i++) renderBody(bodies[i])

  // context.lineWidth = 3
  // context.strokeStyle = "#fff"
  // context.stroke()

  // vectorsForRender.forEach(({ pos, vec }) => {
  //   context.beginPath()
  //
  //   context.moveTo(pos.x * k() + offsetX(), pos.y * k() + offsetY())
  //   context.lineTo((pos.x + vec.x) * k() + offsetX(), (pos.y + vec.y) * k() + offsetY())
  //
  //   context.lineWidth = m(0.0025) * k()
  //   context.strokeStyle = "#f00"
  //   context.stroke()
  //
  //   context.beginPath()
  //   context.arc(pos.x * k() + offsetX(), pos.y * k() + offsetY(), m(0.004) * k(), 0, 2 * PI, false)
  //   context.fillStyle = "#f00"
  //   context.fill()
  // })
}

function renderBody(body) {
  if (body === car) {
    if (!car_img) return

    const x = car.position.x * k() + offsetX()
    const y = car.position.y * k() + offsetY()

    const w = m(carWidth + 2 * wheelSideOffset) * k()
    const h = m(carLength) * k()

    context.translate(x, y)
    context.rotate(car.angle)
    context.drawImage(car_img, -w / 2, -h / 2, w, h)
    context.rotate(-car.angle)
    context.translate(-x, -y)

    Object.values(car.slots).forEach(sensor => sensor?.render())
    return
  }

  // if (body.parts.length > 1) {
  //   for (let i = 1; i < body.parts.length; i++) renderBody(body.parts[i])
  //   return
  // }
  //
  // const vertices = body.vertices
  //
  // context.moveTo(vertices[0].x * k() + offsetX(), vertices[0].y * k() + offsetY())
  //
  // for (let j = 1; j < vertices.length; j += 1) {
  //   context.lineTo(vertices[j].x * k() + offsetX(), vertices[j].y * k() + offsetY())
  // }
  //
  // context.lineTo(vertices[0].x * k() + offsetX(), vertices[0].y * k() + offsetY())
}

export function restart() {
  cancelAnimationFrame(frameHandle)
  removeListeners()
  resetForces()
  clearInterval(runnerHandle)
  clearInterval(tickCounterHandle)
  initMatter()
}

export function setTimeScale(scale) {
  timeScale = scale
  engine.timing.timeScale = scale
}

export function setCameraScale(scale) {
  cameraScale = scale
}
