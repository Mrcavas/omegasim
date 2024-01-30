import { Bodies, Composite, Engine, Events, Runner } from "matter-js"
import { canvas, context, hostLog, updateTime } from "./worker.js"
import { body, m, PI, PX2M } from "./utils.js"
import { resetForces, tick } from "./forces.js"

let frameHandle
let vectorsForRender = []
export let engine
let runner
let cameraScale = 1,
  timeScale = 1
export const events = new EventTarget()
export let car
const listeners = []
export const addListener = (name, cb) => {
  events.addEventListener(name, e => cb(...e.detail))
  listeners.push({ name, cb })
}
const removeListeners = () => listeners.forEach(({ name, cb }) => events.removeEventListener(name, cb))

export const wheelFrontOffset = 0.02
export const wheelSideOffset = 0.0125
export const wheelDiameter = 0.046
export const carWidth = 0.09
export const carLength = 0.18

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
  hostLog("Initializing Physics Engine (powered by Matter.js)")
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
      friction: 1,
      frictionAir: 1,
      frictionStatic: 0.5,
    })
  )

  const centerX = carWidth / 2
  const centerY = carLength / 2

  const offsetX = wheelSideOffset / 2 - centerX
  const offsetY = wheelDiameter / 2 - centerY

  car.setParts([
    Bodies.rectangle(0, 0, m(carWidth), m(carLength)),
    Bodies.rectangle(
      m(-wheelSideOffset + offsetX),
      m(wheelFrontOffset + offsetY),
      m(wheelSideOffset),
      m(wheelDiameter)
    ),
    Bodies.rectangle(m(carWidth + offsetX), m(wheelFrontOffset + offsetY), m(wheelSideOffset), m(wheelDiameter)),
    Bodies.rectangle(
      m(-wheelSideOffset + offsetX),
      m(carLength - wheelFrontOffset - wheelDiameter + offsetY),
      m(wheelSideOffset),
      m(wheelDiameter)
    ),
    Bodies.rectangle(
      m(carWidth + offsetX),
      m(carLength - wheelFrontOffset - wheelDiameter + offsetY),
      m(wheelSideOffset),
      m(wheelDiameter)
    ),
  ])

  car.setMass(m(1))

  Composite.addBody(engine.world, car)
  Composite.add(
    engine.world,
    [...Array(50).keys()].map(n => Bodies.rectangle(m(-0.1), m(0.5 + n * 2), m(0.01), m(1), { isStatic: true }))
  )

  vectorsForRender = []
  render()

  runner = Runner.create()
  Runner.run(runner, engine)

  Events.on(runner, "beforeTick", ({ timestamp }) => {
    vectorsForRender = []
    updateTime(BigInt(Math.trunc(timestamp)))
    tick(engine.timing.lastDelta / 1000, timestamp / 1000)
  })
}

export const renderVector = (pos, vec) => vectorsForRender.push({ pos, vec: vec })

const k = () => PX2M * 1000 * cameraScale

const offsetX = () => canvas.width / 2 - car.position.x * k()
const offsetY = () => canvas.height / 2 - car.position.y * k()

function render() {
  const bodies = Composite.allBodies(engine.world)

  frameHandle = requestAnimationFrame(render)

  context.fillStyle = "#000"
  context.fillRect(0, 0, canvas.width, canvas.height)

  context.beginPath()

  for (let i = 0; i < bodies.length; i++) renderBody(bodies[i])

  context.lineWidth = 3
  context.strokeStyle = "#fff"
  context.stroke()

  vectorsForRender.forEach(({ pos, vec }) => {
    context.beginPath()

    context.moveTo(pos.x * k() + offsetX(), pos.y * k() + offsetY())
    context.lineTo((pos.x + vec.x) * k() + offsetX(), (pos.y + vec.y) * k() + offsetY())

    context.lineWidth = 3
    context.strokeStyle = "#f00"
    context.stroke()

    context.beginPath()
    context.arc(pos.x * k() + offsetX(), pos.y * k() + offsetY(), 5, 0, 2 * PI, false)
    context.fillStyle = "#f00"
    context.fill()
  })
}

function renderBody(body) {
  if (body.parts.length > 1) {
    for (let i = 1; i < body.parts.length; i++) renderBody(body.parts[i])
    return
  }
  const vertices = body.vertices

  context.moveTo(vertices[0].x * k() + offsetX(), vertices[0].y * k() + offsetY())

  for (let j = 1; j < vertices.length; j += 1) {
    context.lineTo(vertices[j].x * k() + offsetX(), vertices[j].y * k() + offsetY())
  }

  context.lineTo(vertices[0].x * k() + offsetX(), vertices[0].y * k() + offsetY())
}

export function restart() {
  cancelAnimationFrame(frameHandle)
  removeListeners()
  resetForces()
  Runner.stop(runner)
  initMatter()
}

export function setTimeScale(scale) {
  timeScale = scale
  engine.timing.timeScale = scale
}

export function setCameraScale(scale) {
  cameraScale = scale
}
