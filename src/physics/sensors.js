import { m } from "./utils.js"
import { k, offsetX, offsetY } from "./main.js"
import { context } from "./worker.js"

export default class Sensor {
  width = 0.031
  height = 0.031

  constructor(slot, car, img) {
    this.slot = slot
    this.car = car
    this.img = img
  }

  get insidePosition() {
    return {
      1: m(-0.0156, 0.0926),
      2: m(0.0156, 0.0926),
    }[this.slot]
  }

  get position() {
    return this.car.position.add(this.insidePosition.rotate(this.car.angle))
  }

  render() {
    if (!this.img) return

    const x = this.position.x * k() + offsetX()
    const y = this.position.y * k() + offsetY()

    const w = m(this.width) * k()
    const h = m(this.height) * k()

    context.translate(x, y)
    context.rotate(this.car.angle)
    context.drawImage(this.img, -w / 2, -h / 2, w, h)
    context.rotate(-this.car.angle)
    context.translate(-x, -y)
  }
}
