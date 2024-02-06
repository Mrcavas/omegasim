import Sensor from "../sensors.js"
import { addListener, renderVector } from "../main.js"
import liner_png from "/liner.png?url"
import { v } from "../utils.js"

let liner_img
fetch(liner_png)
  .then(res => res.blob())
  .then(blob => createImageBitmap(blob))
  .then(img => (liner_img = img))

export default class Liner extends Sensor {
  constructor(slot, car, id) {
    super(slot, car, liner_img)
  }

  valueFromColor(color) {
    const norm = color / 255
    return 700 * (-2 * norm ** 3 + 3 * norm ** 2) + 200
  }

  tick(time) {
    renderVector(this.position, v(0, 0))
  }
}
