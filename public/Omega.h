#ifndef	_OMEGA_H
#define	_OMEGA_H

#include <stdio.h>
#include <math.h>

extern "C" uint64_t millis();
extern "C" void delay(uint64_t time);

extern "C" void setMotors(int8_t leftPower, int8_t rightPower);
extern "C" void setMotorLeft(int8_t leftPower);
extern "C" void setMotorRight(int8_t rightPower);

extern "C" uint16_t getLineSensor(uint8_t channel);
extern "C" uint16_t getUSDistance(uint8_t channel);

extern "C" void setLed(uint8_t channel, bool state);
extern "C" bool readButton(uint8_t channel);
extern "C" void setServo(uint8_t channel, uint8_t angle);

extern "C" void setXY(int16_t x, int16_t y);

#endif
