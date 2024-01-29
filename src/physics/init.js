import { Body, Bodies, Composite, Engine, Runner } from "matter-js"
import { canvas, context, hostLog } from "./worker.js"

export let engine
export const events = new EventTarget()
let car

const addListener = (name, cb) => events.addEventListener(name, e => cb(...e.detail))

export function initMatter() {
  engine = Engine.create()
  engine.gravity.y = 0

  car = Bodies.circle(0, 0, 20)

  Composite.add(engine.world, [car])

  addListener("setMotorLeft", power => {
    hostLog(`setting left power in phys to ${power}`)
  })

  addListener("setMotorRight", power => {
    hostLog(`setting right power in phys to ${power}`)
  })

  addListener("setXY", (x, y) => Body.setPosition(car, { x, y }))

  let tick = 0

  ;(function render() {
    tick++
    const bodies = Composite.allBodies(engine.world)

    requestAnimationFrame(render)

    context.fillStyle = "#000"
    context.fillRect(0, 0, canvas.width, canvas.height)

    const halfWidth = canvas.width / 2,
      halfHeight = canvas.height / 2

    context.beginPath()

    for (let i = 0; i < bodies.length; i += 1) {
      const vertices = bodies[i].vertices

      context.moveTo(vertices[0].x + halfWidth, vertices[0].y + halfHeight)

      for (let j = 1; j < vertices.length; j += 1) {
        context.lineTo(vertices[j].x + halfWidth, vertices[j].y + halfHeight)
      }

      context.lineTo(vertices[0].x + halfWidth, vertices[0].y + halfHeight)
    }

    context.lineWidth = 3
    context.strokeStyle = "#fff"
    context.stroke()
  })()

  const runner = Runner.create()

  Runner.run(runner, engine)
}
