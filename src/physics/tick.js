import { addListener, car, carWidth, renderVector } from "./main.js"
import { m, PX2M, v } from "./utils.js"

export const n = v => v / 200 // convert to newtons

const pwmToVoltage = pwm => {
  const pwm_abs = Math.abs(pwm)
  if (pwm_abs < 35) return 0
  return Math.sign(pwm) * (0.00001208 * pwm_abs ** 3 + -0.003006 * pwm_abs ** 2 + 0.2858 * pwm_abs + -2.635)
}

let leftVoltage = 0
let rightVoltage = 0
let leftForceVec, rightForceVec

const R = 5.4
const min_vel = 3
const friction = 0

let last_vel_dir = 0

export function tick(delta, time) {
  Object.values(car.slots).forEach(sensor => sensor?.tick && sensor.tick(delta, time))

  if (time === 0) {
    addListener("setMotorLeft", pwm => {
      pwm = Math.min(100, Math.max(-100, pwm))
      leftVoltage = pwmToVoltage(pwm)
    })
    addListener("setMotorRight", pwm => {
      pwm = Math.min(100, Math.max(-100, pwm))
      rightVoltage = pwmToVoltage(pwm)
    })
  }

  const leftPos = m(-carWidth / 2, 0)
    .rotate(car.angle)
    .add(car.position)
  const rightPos = m(carWidth / 2, 0)
    .rotate(car.angle)
    .add(car.position)

  const dir = v(0, 1).rotate(car.angle)
  const vel = car.velocity.mult(PX2M)
  const vel_dir_prev = vel.dot(dir)
  let vel_dir_pred = 2 * vel_dir_prev - last_vel_dir
  last_vel_dir = vel_dir_prev
  if (-min_vel < vel_dir_pred && vel_dir_pred < min_vel) vel_dir_pred = min_vel

  const leftForce = (Math.sign(leftVoltage) * leftVoltage ** 2) / (R * vel_dir_pred)
  const rightForce = (Math.sign(rightVoltage) * rightVoltage ** 2) / (R * vel_dir_pred)

  leftForceVec = m(0, n(leftForce)).rotate(car.angle)
  rightForceVec = m(0, n(rightForce)).rotate(car.angle)

  car.applyForce(leftPos, leftForceVec)
  car.applyForce(rightPos, rightForceVec)
}

export function afterTick(delta, time) {
  Object.values(car.slots).forEach(sensor => sensor?.afterTick && sensor.afterTick(delta, time))

  const leftPos = m(-carWidth / 2, 0)
    .rotate(car.angle)
    .add(car.position)
  const rightPos = m(carWidth / 2, 0)
    .rotate(car.angle)
    .add(car.position)

  renderVector(leftPos, leftForceVec)
  renderVector(rightPos, rightForceVec)
}

export function resetForces() {
  leftVoltage = 0
  rightVoltage = 0
}
