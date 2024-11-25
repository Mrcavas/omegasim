import { raycast } from "../../assets/raycast.js"
import { k, offsetX, offsetY, renderVector } from "../main.js"
import { m, PX2M, v } from "../utils.js"
import { context, updateUS } from "../worker.js"
import Sensor from "./sensor.js"
import base_png from "/echo-base.png"
import us_png from "/echo-mes.png"

let baseImg, usImg
fetch(base_png)
  .then(res => res.blob())
  .then(blob => createImageBitmap(blob))
  .then(img => (baseImg = img))
fetch(us_png)
  .then(res => res.blob())
  .then(blob => createImageBitmap(blob))
  .then(img => (usImg = img))

export default class USMeter extends Sensor {
  radius = 0.0175
  maxDistance = 2
  angle = 0
  target = 0
  vel = (160 / 1.5 / 180) * Math.PI

  constructor(car, bodies) {
    super(3, car, new Promise(() => {}))
    this.bodies = bodies
  }

  tick(delta, time) {
    const dAngle = (this.vel * delta) / 1000
    if (this.angle < this.target) {
      this.angle = Math.min(this.target, this.angle + dAngle)
    }
    if (this.angle > this.target) {
      this.angle = Math.max(this.target, this.angle - dAngle)
    }

    const point = raycast(this.bodies, this.startPos, this.endPos, true)[0]?.point?.toPhysVector()
    if (!point) {
      updateUS(0)
      return
    }
    updateUS(Math.round(point.sub(this.startPos).magnitude() * PX2M * 100) * (0.98 + Math.random() * 0.04))
  }

  setAngle(newAngle) {
    this.target = (Math.min(80, Math.max(-80, newAngle)) / 180) * Math.PI
  }

  get startPos() {
    return this.position.add(m(0, this.radius).rotate(this.angle + this.car.angle))
  }

  get endPos() {
    return this.startPos.add(m(0, this.maxDistance).rotate(this.angle + this.car.angle))
  }

  afterTick() {
    renderVector(this.position, v())
  }

  render() {
    if (!baseImg || !usImg) return

    const x = this.position.x * k() + offsetX()
    const y = this.position.y * k() + offsetY()

    const w = m(0.065) * k()
    const h = m(0.0392307692) * k()

    context.translate(x, y)
    context.rotate(this.car.angle)

    context.drawImage(baseImg, -w / 2, -h / 2, w, h)

    context.rotate(this.angle)
    context.drawImage(usImg, -w / 2, -h / 2, w, h)
    context.rotate(-this.angle)

    context.rotate(-this.car.angle)
    context.translate(-x, -y)
  }
}
