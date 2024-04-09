import { Bodies, Body, Composite, Engine } from "matter-js"
import { canvas, context, sendMain, updateAccelX, updateAccelY, updateGyroZ, updateTime } from "./worker.js"
import { body, m, PI, PX2M, v } from "./utils.js"
import { resetForces, tick } from "./tick.js"
import car_png from "/car.png?url"
import line0_png from "/0/line.png?url"
import line1_png from "/12/line.png?url"
import line2_png from "/12/line.png?url"
import Liner from "./sensors/liner.js"
import USMeter from "./sensors/usmeter.js"
import dist0_png from "/0/line_dist.png?url"
import dist1_png from "/12/line_dist.png?url"
import dist2_png from "/12/line_dist.png?url"
import { UPNG } from "../assets/UPNG.js"

export let levelId

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

let line0_img,
  line1_img,
  line2_img,
  line_imgs = []
fetch(line0_png)
  .then(res => res.blob())
  .then(blob => createImageBitmap(blob))
  .then(img => {
    line0_img = img
    line_imgs = [line0_img, line1_img, line2_img]
  })
fetch(line1_png)
  .then(res => res.blob())
  .then(blob => createImageBitmap(blob))
  .then(img => {
    line1_img = img
    line_imgs = [line0_img, line1_img, line2_img]
  })
fetch(line2_png)
  .then(res => res.blob())
  .then(blob => createImageBitmap(blob))
  .then(img => {
    line2_img = img
    line_imgs = [line0_img, line1_img, line2_img]
  })

let distDatas = [],
  distWidths = [],
  distHeights = []
;[dist0_png, dist1_png, dist2_png].forEach((png, id) => {
  fetch(png)
    .then(res => res.arrayBuffer())
    .then(buf => {
      const img = UPNG.decode(buf)
      distDatas[id] = new Uint8Array(UPNG.toRGBA8(img)[0])
      distWidths[id] = img.width
      distHeights[id] = img.height
    })
})

export let distData, distWidth, distHeight

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
export const carLength = 0.197

export let lineSize = v(),
  linePosition = v(),
  linePositionMargined = v()

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

export function initMatter(id) {
  levelId = id
  let obstacles = []

  distData = distDatas[id]
  distWidth = distWidths[id]
  distHeight = distHeights[id]

  if (id === 0) {
    lineSize = m(1.015, 1.015)
    linePosition = m(-1.015 * 0.75 + carLength / 2, -1.015 + 0.025 / 2)
    linePositionMargined = linePosition.add(m(-0.003, -0.003))
  }
  if (id === 1 || id === 2) {
    lineSize = m(3, 1.4)
    linePosition = m(-0.185, -0.4532)
    linePositionMargined = linePosition
    if (id === 2) {
      const positions = [m(0.245, 0.3194), m(1.035, 0.2568), m(1.733, 0.5902)]

      obstacles = positions.map(pos => {
        const circle = Bodies.circle(pos.x, pos.y, m(0.035), {
          friction: 0,
          frictionAir: 0.8,
          frictionStatic: 0,
        })
        Body.setMass(circle, m(0.01))
        return circle
      })
    }
  }

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

  car.slots = {
    1: new Liner(1, car, 1),
    2: new Liner(2, car, 2),
    3: new USMeter(car, obstacles),
  }

  const centerX = carWidth / 2
  const centerY = carLength / 2

  const partOffsetX = wheelSideOffset / 2 - centerX
  const partOffsetY = wheelDiameter / 2 - centerY

  car.setParts([
    Bodies.rectangle(0, 0, m(carWidth), m(carLength)),
    Bodies.rectangle(m(-wheelSideOffset + partOffsetX), m(partOffsetY), m(wheelSideOffset), m(wheelDiameter)),
    Bodies.rectangle(m(carWidth + partOffsetX), m(partOffsetY), m(wheelSideOffset), m(wheelDiameter)),
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

  car.setAngle(PI * 1.5)
  car.setMass(m(0.858))

  Composite.add(engine.world, obstacles)
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

  let lastVel = v()

  Engine.update(engine, 0)
  runnerHandle = setInterval(() => {
    const now = performance.now()
    const delta = now - lastTick
    lastTick = now
    if (delta * timeScale > 20) {
      slowTicks += 1
      console.log(delta * timeScale)
    }

    vectorsForRender = []
    updateTime(BigInt(Math.trunc(engine.timing.timestamp)))
    tick(delta, engine.timing.timestamp)
    Engine.update(engine, delta)

    const vel = car.velocity.mult(PX2M).rotate(-car.angle)

    const accel = vel.sub(lastVel).mult(1000000 / Body._baseDelta / car.deltaTime)

    updateAccelX(accel.y * (0.99 + Math.random() * 0.02))
    updateAccelY(-accel.x * (0.99 + Math.random() * 0.02))
    updateGyroZ(((car.angle - car.anglePrev) / car.deltaTime / Math.PI) * 180 * 1000 * (0.99 + Math.random() * 0.02))

    lastVel = vel

    // afterTick(delta, engine.timing.timestamp)
  })
}

export const renderVector = (pos, vec) => vectorsForRender.push({ pos, vec: vec })

function render() {
  frameHandle = requestAnimationFrame(render)

  const bodies = Composite.allBodies(engine.world)

  context.fillStyle = "#111111"
  context.fillRect(0, 0, canvas.width, canvas.height)

  if (line_imgs[levelId]) {
    context.drawImage(
      line_imgs[levelId],
      linePosition.x * k() + offsetX(),
      linePosition.y * k() + offsetY(),
      lineSize.x * k(),
      lineSize.y * k()
    )
  }

  context.fillStyle = "#b5b5b5"
  context.strokeStyle = "#5d5d5d"
  context.lineWidth = m(0.005) * k()

  for (let i = 0; i < bodies.length; i++) renderBody(bodies[i])

  vectorsForRender.forEach(({ pos, vec }) => {
    context.beginPath()

    context.moveTo(pos.x * k() + offsetX(), pos.y * k() + offsetY())
    context.lineTo((pos.x + vec.x) * k() + offsetX(), (pos.y + vec.y) * k() + offsetY())

    context.lineWidth = m(0.0025) * k()
    context.strokeStyle = "#f00"
    context.stroke()

    context.beginPath()
    context.arc(pos.x * k() + offsetX(), pos.y * k() + offsetY(), m(0.004) * k(), 0, 2 * PI, false)
    context.fillStyle = "#f00"
    context.fill()
  })
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

  if (body.parts.length > 1) {
    for (let i = 1; i < body.parts.length; i++) renderBody(body.parts[i])
    return
  }

  const vertices = body.vertices

  context.beginPath()
  context.moveTo(vertices[0].x * k() + offsetX(), vertices[0].y * k() + offsetY())

  for (let j = 1; j < vertices.length; j += 1) {
    context.lineTo(vertices[j].x * k() + offsetX(), vertices[j].y * k() + offsetY())
  }

  context.lineTo(vertices[0].x * k() + offsetX(), vertices[0].y * k() + offsetY())
  context.closePath()

  context.fill()
  context.stroke()
}

export function restart() {
  cancelAnimationFrame(frameHandle)
  removeListeners()
  resetForces()
  clearInterval(runnerHandle)
  clearInterval(tickCounterHandle)
  initMatter(levelId)
}

export function setTimeScale(scale) {
  timeScale = scale
  engine.timing.timeScale = scale
}

export function setCameraScale(scale) {
  cameraScale = scale
}
