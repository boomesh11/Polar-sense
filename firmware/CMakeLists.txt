cmake_minimum_required(VERSION 3.14)
project(polarsense_firmware C)

set(CMAKE_C_STANDARD 99)

include_directories(src)

# Host Simulation Executable
add_executable(polarsense_host
    host/main_host.c
    src/mission_fsm.c
    src/hal_stubs.c
)

# Unit Tests Executable
add_executable(test_runner
    tests/test_ice_logic.c
    src/mission_fsm.c
    src/hal_stubs.c
)

enable_testing()
add_test(NAME IceLogicTest COMMAND test_runner)
