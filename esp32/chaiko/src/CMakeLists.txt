# This file was automatically generated for projects
# without default 'CMakeLists.txt' file.

FILE(GLOB_RECURSE app_sources ${CMAKE_SOURCE_DIR}/src/*.*)

idf_component_register(
    SRCS 
        "main.c"
        "websocket.c"
        "interrupt.c"
        "wifi.c"
       
    INCLUDE_DIRS 
        "."
    REQUIRES esp_websocket_client json esp_wifi esp_event esp_netif nvs_flash
)
