import Sensor from "./sensor.js"
import { distData, distHeight, distWidth, linePositionMargined, renderVector } from "../main.js"
import liner_png from "/liner.png?url"
import { updateLine1, updateLine2 } from "../worker.js"
import { v } from "../utils.js"

let linerImg = fetch(liner_png)
  .then(res => res.blob())
  .then(blob => createImageBitmap(blob))

export default class Liner extends Sensor {
  constructor(slot, car, id) {
    super(slot, car, linerImg)
    this.id = id
  }

  getColorOn(x, y) {
    if (!distData || 0 > x || x > distWidth - 1 || 0 > y || y > distHeight - 1) return 0
    return distData[(y * distWidth + x) * 4]
  }

  valueFromColor(color) {
    const norm = color / 255
    return (-2 * norm ** 3 + 3 * norm ** 2) * 700 + 200
  }

  tick(delta, time) {
    // if (time !== 0 && time - this.lastTick < 15) return
    // this.lastTick = time
    const pos = this.position.sub(linePositionMargined)
    const x = Math.round(pos.x),
      y = Math.round(pos.y)
    if (this.id === 1) updateLine1(this.valueFromColor(this.getColorOn(x, y)) + Math.round(Math.random() * 10 - 5))
    if (this.id === 2) updateLine2(this.valueFromColor(this.getColorOn(x, y)) + Math.round(Math.random() * 10 - 5))
  }

  afterTick(delta, time) {
    renderVector(this.position, v())
  }
}
