import Sensor from "../sensors.js"
import { addListener, linePosition, linePositionMargined, renderVector } from "../main.js"
import liner_png from "/liner.png?url"
import dist_png from "/line_dist.png?url"
import { v } from "../utils.js"
import { UPNG } from "../../assets/UPNG.js"
import { updateLine1, updateLine2 } from "../worker.js"

let liner_img = fetch(liner_png)
  .then(res => res.blob())
  .then(blob => createImageBitmap(blob))

let dist_data, width, height
fetch(dist_png)
  .then(res => res.arrayBuffer())
  .then(buf => {
    const img = UPNG.decode(buf)
    dist_data = new Uint8Array(UPNG.toRGBA8(img)[0])
    width = img.width
    height = img.height
  })

export default class Liner extends Sensor {
  constructor(slot, car, id) {
    super(slot, car, liner_img)
    this.id = id
  }

  valueFromColor(color) {
    const norm = color / 255
    return 700 * (-2 * norm ** 3 + 3 * norm ** 2) + 200
  }

  getColorOn(x, y) {
    if (0 > x || x > width - 1 || 0 > y || y > height - 1) return 0
    return dist_data[(y * width + x) * 4]
  }

  tick(delta, time) {
    const pos = this.position.sub(linePositionMargined)
    const x = Math.round(pos.x),
      y = Math.round(pos.y)
    if (this.id === 1) updateLine1(this.valueFromColor(this.getColorOn(x, y)))
    if (this.id === 2) updateLine2(this.valueFromColor(this.getColorOn(x, y)))
  }

  afterTick(delta, time) {
    renderVector(this.position, v(0, 0))
  }
}
