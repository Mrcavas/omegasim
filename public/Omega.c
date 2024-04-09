#include <stdio.h>
#include <Omega.h>

extern "C" void initOmega() {
    setbuf(stdout, NULL);
    printf("\x1b[96mInitializing Omega \x1b[1mv. a1.01\x1b[0m\n");
}

void setMotors(int16_t leftPower, int16_t rightPower) {
    setMotorLeft(leftPower);
    setMotorRight(rightPower);
}

void delay(uint64_t ms) {
    uint64_t start = millis();
    while (millis() - start < ms) {}
}

void tick() {
    delay(2);
}

extern "C" void setServoInternal(int8_t angle);

void setServo(int8_t angle) {
    setServoInternal(angle);
    delay(10);
}