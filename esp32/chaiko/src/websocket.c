#include "websocket.h"
#include <stdbool.h>
#include <stddef.h>
#include <string.h>

#include "cJSON.h"
#include "esp_log.h"
#include "esp_websocket_client.h"
#include "freertos/FreeRTOS.h"
#include "freertos/queue.h"
#include "stdlib.h"

// websocket functions

static const char *TAG = "order_websocket";
static QueueHandle_t order_queue;
static char *order_fragment;
static size_t order_fragment_capacity;

static void order_websocket_event_handler(
	void *handler_args,
	esp_event_base_t base,
	int32_t event_id,
	void *event_data)
{
	if (event_id != WEBSOCKET_EVENT_DATA) {
		return;
	}

	esp_websocket_event_data_t *data = (esp_websocket_event_data_t *)event_data;
	if (data->op_code == 0x1 && data->payload_offset == 0) {
		free(order_fragment);
		order_fragment = NULL;
		order_fragment_capacity = 0;

		if (data->payload_len <= 0) {
			return;
		}

		order_fragment = malloc((size_t)data->payload_len + 1);
		if (order_fragment == NULL) {
			ESP_LOGE(TAG, "Unable to allocate order message buffer");
			return;
		}
		order_fragment_capacity = (size_t)data->payload_len + 1;
	}

	if (order_fragment == NULL || data->payload_offset < 0 || data->data_len < 0) {
		return;
	}

	size_t offset = (size_t)data->payload_offset;
	size_t length = (size_t)data->data_len;
	if (offset + length >= order_fragment_capacity) {
		ESP_LOGE(TAG, "Received order message is too large");
		free(order_fragment);
		order_fragment = NULL;
		order_fragment_capacity = 0;
		return;
	}

	memcpy(order_fragment + offset, data->data_ptr, length);
	if (!data->fin || offset + length < (size_t)data->payload_len) {
		return;
	}

	order_fragment[offset + length] = '\0';
	char *complete_order = order_fragment;
	order_fragment = NULL;
	order_fragment_capacity = 0;
	if (xQueueSend(order_queue, &complete_order, 0) != pdTRUE) {
		ESP_LOGW(TAG, "Dropping order because the queue is full");
		free(complete_order);
	}
}

bool websocket_init_order_receiver(esp_websocket_client_handle_t client)
{
	if (order_queue == NULL) {
		order_queue = xQueueCreate(1, sizeof(char *));
		if (order_queue == NULL) {
			ESP_LOGE(TAG, "Unable to create order queue");
			return false;
		}
	}

	return esp_websocket_register_events(
		client,
		WEBSOCKET_EVENT_DATA,
		order_websocket_event_handler,
		NULL) == ESP_OK;
}

char *websocket_wait_for_order(TickType_t timeout)
{
	char *message = NULL;
	if (order_queue != NULL) {
		xQueueReceive(order_queue, &message, timeout);
	}
	return message;
}

void websocket_free_order(char *message)
{
	free(message);
}

bool extract_pump_counts(const char *message, int *num_pumps)
{
	cJSON *root = cJSON_Parse(message);
	if (root == NULL) {
		ESP_LOGE(TAG, "Received invalid JSON");
		return false;
	}

	cJSON *order = cJSON_GetObjectItemCaseSensitive(root, "order");
	cJSON *pump_counts = cJSON_GetObjectItemCaseSensitive(order ? order : root, "pumpCounts");
	if (!cJSON_IsArray(pump_counts)) {
		ESP_LOGE(TAG, "Message has no pumpCounts array");
		cJSON_Delete(root);
		return false;
	}

	memset(num_pumps, 0, sizeof(num_pumps));
	for (int index = 0; index < PUMP_COUNT_SIZE; index++) {
		cJSON *pump_count = cJSON_GetArrayItem(pump_counts, index);
		num_pumps[index] = pump_count->valueint;
	}

	ESP_LOGI(TAG, "Extracted pump counts: [%d, %d, %d, %d]", num_pumps[0], num_pumps[1], num_pumps[2], num_pumps[3]);
	cJSON_Delete(root);
	return true;
}