import Sensor from "../sensors.js"
import { addListener, renderVector } from "../main.js"
import liner_png from "/liner.png?url"
import dist_png from "/line_dist.png?url"
import { v } from "../utils.js"

let liner_img
fetch(liner_png)
  .then(res => res.blob())
  .then(blob => createImageBitmap(blob))
  .then(img => (liner_img = img))

let dist_canv
fetch(dist_png)
  .then(res => res.blob())
  .then(blob => createImageBitmap(blob))
  .then(img => {
    console.log(dist_canv)
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

  tick(time) {
    renderVector(this.position, v(0, 0))
  }
}
