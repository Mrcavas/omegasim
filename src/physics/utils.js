import { Body, Vector } from "matter-js"

Array.prototype.equals = function (array) {
  if (!array) return false
  if (array === this) return true
  if (this.length !== array.length) return false

  for (let i = 0, l = this.length; i < l; i++) {
    if (this[i] instanceof Array && array[i] instanceof Array) {
      if (!this[i].equals(array[i])) return false
    } else if (this[i] !== array[i]) {
      return false
    }
  }
  return true
}

Object.defineProperty(Array.prototype, "equals", { enumerable: false })

const bodyMethodNames = Object.entries(Body)
  .filter(entry => typeof entry[1] === "function")
  .map(entry => entry[0])

export const body = obj =>
  new Proxy(obj, {
    get(target, p, receiver) {
      if (bodyMethodNames.includes(p)) return (...args) => Body[p](obj, ...args)
      return Reflect.get(target, p, receiver)
    },
  })

Object.entries(Vector).forEach(entry => {
  if (typeof entry[1] !== "function") return
  Object.defineProperty(Object.prototype, entry[0], {
    get() {
      const keys = Object.keys(this)
      if (!keys.equals(["x", "y"]) && !keys.equals(["y", "x"])) return undefined
      return (...args) => Vector[entry[0]](this, ...args)
    },
  })
})

export const PX2M = 0.0002 // 1 px = 0.0002 m
export const M2PX = 1 / PX2M // 5000 px = 1 m

export const PI = Math.PI

export const v = (x, y) => ({ x: x ?? 0, y: y ?? 0 })
export const m = (x, y) => (y === undefined ? x * M2PX : v(x, y).mult(M2PX))
