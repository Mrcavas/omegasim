#ifndef	_OMEGA_H
#define	_OMEGA_H

#include <stdio.h>
#include <math.h>

extern "C" uint64_t millis();
void delay(uint64_t ms);
void tick();

extern "C" void setMotors(int16_t leftPower, int16_t rightPower);
extern "C" void setMotorLeft(int16_t leftPower);
extern "C" void setMotorRight(int16_t rightPower);
extern "C" void setServo(int8_t angle);


extern "C" uint16_t getLineSensor(uint8_t channel);
extern "C" uint8_t getUSDistance();

extern "C" double getAccelX();
extern "C" double getAccelY();
extern "C" double getGyroZ();

#endif
