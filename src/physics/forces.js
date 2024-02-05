import { addListener, car, carWidth, renderVector } from "./main.js"
import { m } from "./utils.js"

export const n = v => v / 200 // convert to newtons

const pwmToForce = pwm => pwm / 5

export let leftForce = 0
export let rightForce = 0

export function tick(delta, time) {
  if (time === 0) {
    addListener("setMotorLeft", pwm => (leftForce = pwmToForce(pwm)))
    addListener("setMotorRight", pwm => (rightForce = pwmToForce(pwm)))
    console.log(car)
  }

  const leftPos = m(-carWidth / 2, 0)
    .rotate(car.angle)
    .add(car.position)
  const rightPos = m(carWidth / 2, 0)
    .rotate(car.angle)
    .add(car.position)
  const leftForceVec = m(0, n(leftForce)).rotate(car.angle)
  const rightForceVec = m(0, n(rightForce)).rotate(car.angle)

  car.applyForce(leftPos, leftForceVec)
  car.applyForce(rightPos, rightForceVec)

  renderVector(leftPos, leftForceVec)
  renderVector(rightPos, rightForceVec)
}

export function resetForces() {
  leftForce = 0
  rightForce = 0
}
