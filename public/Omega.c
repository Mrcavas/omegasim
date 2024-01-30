#include <stdio.h>
#include <Omega.h>

extern "C" void initOmega() {
    setbuf(stdout, NULL);
    printf("\x1b[96mInitializing Omega \x1b[1mv. a1\x1b[0m\n");
}

void setMotors(int8_t leftPower, int8_t rightPower) {
  setMotorLeft(leftPower);
  setMotorRight(rightPower);
}

void delay(uint64_t ms) {
    uint64_t start = millis();
    while (millis() - start < ms) {}
}