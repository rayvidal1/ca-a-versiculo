cmake_minimum_required(VERSION 3.13)
project(appmodules)

include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)

# Fix: explicitly link libc++_shared to resolve undefined C++ STL symbols with NDK 27
find_library(c++_shared_LIBRARY c++_shared)
target_link_libraries(${CMAKE_PROJECT_NAME} ${c++_shared_LIBRARY})
