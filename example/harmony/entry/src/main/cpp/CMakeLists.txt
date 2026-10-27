project(rnapp)
cmake_minimum_required(VERSION 3.4.1)
set(CMAKE_NINJA_FORCE_RESPONSE_FILE 1)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_FLAGS "-fstack-protector-strong -Wl,-z,relro,-z,now -fPIE -pie")
set(OH_MODULES_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../../oh_modules")
set(OH_MODULES "${OH_MODULES_DIR}")
set(RNOH_APP_DIR "${CMAKE_CURRENT_SOURCE_DIR}")
set(RNOH_CPP_DIR "${OH_MODULES_DIR}/@rnoh/react-native-openharmony/src/main/cpp")
set(WITH_HITRACE_SYSTRACE 1)
add_compile_definitions(WITH_HITRACE_SYSTRACE)

add_subdirectory("${RNOH_CPP_DIR}" ./rn)

# RNOH_BEGIN: add_plugin_subdirectories
# 手动注册示例（不支持autolink的插件）:
# add_subdirectory("${OH_MODULES}/@oh-rn/YOUR_PACKAGE_NAME/src/main/cpp" ./YOUR_TARGET_NAME)
# autolink支持:
include("${CMAKE_CURRENT_SOURCE_DIR}/autolinking.cmake")
# RNOH_END: add_plugin_subdirectories

file(GLOB GENERATED_CPP_FILES "./generated/*.cpp")

add_library(rnoh_app SHARED
    ${GENERATED_CPP_FILES}
    "./PackageProvider.cpp"
    "${RNOH_CPP_DIR}/RNOHAppNapiBridge.cpp"
)

target_link_libraries(rnoh_app PUBLIC rnoh)

# RNOH_BEGIN: link_plugins
# 手动注册示例（不支持autolink的插件）:
# target_link_libraries(rnoh_app PUBLIC YOUR_TARGET_NAME)
# autolink支持:
autolink_libraries(rnoh_app)
# RNOH_END: link_plugins
