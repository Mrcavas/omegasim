#include <stdio.h>
#include <Omega.h>

extern "C" void initOmega() {
    setbuf(stdout, NULL);
    printf("initializing Omega\n");
}

void setMotors(int8_t leftPower, int8_t rightPower) {
  setMotorLeft(leftPower);
  setMotorRight(rightPower);
}