#ifndef WEBSOCKET_H
#define WEBSOCKET_H

#include "wifi_credentials.h"

#define ORDER_WEBSOCKET_URI "ws://" IP_ADDRESS ":8000/ws/orders"
#define STATUS_WEBSOCKET_URI "ws://" IP_ADDRESS ":8000/ws/status"
#define PUMP_COUNT_SIZE 4

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <string.h>

#include "esp_event.h"
#include "esp_websocket_client.h"
#include "freertos/FreeRTOS.h"

bool extract_pump_counts(const char *message, int *num_pumps);
bool websocket_init_order_receiver(esp_websocket_client_handle_t client);
char *websocket_wait_for_order(TickType_t timeout);
void websocket_free_order(char *message);

#endif