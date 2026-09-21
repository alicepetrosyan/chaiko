#include "websocket.h"
#include "interrupt.h"
#include "wifi.h"
#include "esp_log.h"
#include "esp_websocket_client.h"
#include "driver/gpio.h"
#include "freertos/FreeRTOS.h"
#include "freertos/semphr.h"
#include "freertos/task.h"
#include <stdbool.h>
#include "string.h"

#define MILLISECONDS_PER_PUMP 5000

/* REGARDING STATUS: if machine is busy or offline, 
the webserver will not send any new recipes to the machine
if the machine is online and idle, it will accept new recipes
if the machine is busy, it will send a status update indicating that it is busy 
 and cannot accept new recipes at this time */

// ORDER_URL: ws://${IP_ADDRESS}:8000/ws/orders
// STATUS_URL: ws://${IP_ADDRESS}:8000/ws/status

typedef struct {
	gpio_num_t pin;
	int duration_ms;
	SemaphoreHandle_t completion_semaphore;
} pump_task_args_t;

static const gpio_num_t pump_pins[PUMP_COUNT_SIZE] = {
	PUMP1_PIN,
	PUMP2_PIN,
	PUMP3_PIN,
	PUMP4_PIN,
};
static void process_button_events(
	esp_websocket_client_handle_t status_websocket_client,
	bool *button_held)
{
	button_event_t event;
	while (interrupt_get_button_event(&event)) {
		if (event.pressed && !button_held[event.pump_index]) {
			button_held[event.pump_index] = true;
			gpio_set_level(pump_pins[event.pump_index], 1);
			interrupt_set_machine_state(MACHINE_MANUAL_DISPENSE);
			ESP_LOGI("MAIN", "Manual dispense button pressed for pump %d\n", event.pump_index + 1);
			esp_websocket_client_send_text(
				status_websocket_client,
				"manual dispense",
				strlen("manual dispense"),
				portMAX_DELAY);
		} else if (!event.pressed && button_held[event.pump_index]) {
			button_held[event.pump_index] = false;
			gpio_set_level(pump_pins[event.pump_index], 0);
		}
		ESP_LOGI("MAIN", "Button event: pump_index=%d, pressed=%d\n", event.pump_index + 1, event.pressed);
	}

	bool any_button_held = false;
	for (int pump_index = 0; pump_index < PUMP_COUNT_SIZE; pump_index++) {
		any_button_held |= button_held[pump_index];
	}
	if (!any_button_held) {
		interrupt_set_machine_state(MACHINE_ONLINE);
		esp_websocket_client_send_text(
			status_websocket_client,
			"online",
			strlen("online"),
			portMAX_DELAY);
	}
}

static void pump_task(void *parameter)
{
	pump_task_args_t *args = (pump_task_args_t *)parameter;

	gpio_set_level(args->pin, 1);
	TickType_t remaining_ticks = pdMS_TO_TICKS(args->duration_ms);
	while (!interrupt_order_cancelled() && remaining_ticks > 0) {
		TickType_t delay_ticks = pdMS_TO_TICKS(50);
		if (delay_ticks > remaining_ticks) {
			delay_ticks = remaining_ticks;
		}
		vTaskDelay(delay_ticks);
		remaining_ticks -= delay_ticks;
	}
	gpio_set_level(args->pin, 0);

	xSemaphoreGive(args->completion_semaphore);
	vTaskDelete(NULL);
}

void app_main(void)
{

	// ---- GLOBALS ----
	int num_pumps[PUMP_COUNT_SIZE] = {0};
	char *status_message = "offline"; // default status message

	// ---- SETUP ----

	// initialize gpio
	const uint64_t button_pin_mask = 
		(1ULL << BUTTON1_PIN) |
		(1ULL << BUTTON2_PIN) |
		(1ULL << BUTTON3_PIN) |
		(1ULL << BUTTON4_PIN);
	const uint64_t pump_pin_mask = 
		(1ULL << PUMP1_PIN) |
		(1ULL << PUMP2_PIN) |
		(1ULL << PUMP3_PIN) |
		(1ULL << PUMP4_PIN);

	gpio_config_t button_config = {
		.pin_bit_mask = button_pin_mask,
		.mode = GPIO_MODE_INPUT,
		.pull_up_en = GPIO_PULLUP_ENABLE,
		.pull_down_en = GPIO_PULLDOWN_DISABLE,
		.intr_type = GPIO_INTR_ANYEDGE,
	};
	gpio_config(&button_config);
	if (!interrupt_init()) {
		printf("Failed to initialize button interrupts\n");
		return;
	}

	gpio_config_t pump_config = {
		.pin_bit_mask = pump_pin_mask,
		.mode = GPIO_MODE_OUTPUT,
		.pull_up_en = GPIO_PULLUP_DISABLE,
		.pull_down_en = GPIO_PULLDOWN_DISABLE,
		.intr_type = GPIO_INTR_DISABLE,
	};
	gpio_config(&pump_config);
	gpio_set_level(PUMP1_PIN, 0);
	gpio_set_level(PUMP2_PIN, 0);
	gpio_set_level(PUMP3_PIN, 0);
	gpio_set_level(PUMP4_PIN, 0);

	// initialize motors
	SemaphoreHandle_t pump_completion_semaphore =
		xSemaphoreCreateCounting(PUMP_COUNT_SIZE, 0);
	if (pump_completion_semaphore == NULL) {
		printf("Failed to create pump completion semaphore\n");
		return;
	}

	// initialize wifi and wait until the station has an IP address
	if (wifi_init_sta() != ESP_OK) {
		printf("Failed to initialize Wi-Fi\n");
		return;
	}

	// initialize websocket server
	esp_websocket_client_config_t *order_websocket_cfg = &(esp_websocket_client_config_t){
		.uri = ORDER_WEBSOCKET_URI
	};
	esp_websocket_client_config_t *status_websocket_cfg = &(esp_websocket_client_config_t){
		.uri = STATUS_WEBSOCKET_URI
	};
	esp_websocket_client_handle_t order_websocket_client = esp_websocket_client_init(order_websocket_cfg);
	esp_websocket_client_handle_t status_websocket_client = esp_websocket_client_init(status_websocket_cfg);
	websocket_init_order_receiver(order_websocket_client);
	esp_websocket_client_start(order_websocket_client);
	esp_websocket_client_start(status_websocket_client);
	
	// publish online status to websocket server
	status_message = "online";
	esp_websocket_client_send_text(status_websocket_client, status_message, strlen(status_message), portMAX_DELAY);

	// ---- LOOP ----
	bool button_held[PUMP_COUNT_SIZE] = {false};
	while (1) {
	// wait for the websocket event handler to deliver a complete recipe
	char *incoming_message = websocket_wait_for_order(pdMS_TO_TICKS(50));
	if (incoming_message == NULL) {
		process_button_events(status_websocket_client, button_held);
		continue;
	}
	ESP_LOGI("MAIN", "Incoming message: %s\n", incoming_message);

	// fetch syrupPumps from websocket message
	if (!extract_pump_counts(incoming_message, num_pumps)) {
		websocket_free_order(incoming_message);
		continue;
	}
	else {
		ESP_LOGI("MAIN", "Pump counts: [%d, %d, %d, %d]\n", num_pumps[0], num_pumps[1], num_pumps[2], num_pumps[3]);
	}

	// publish busy status to websocket server
	interrupt_set_machine_state(MACHINE_FULFILLING_ORDER);
	interrupt_reset_order_cancelled();
	status_message = "fulfilling order";
	ESP_LOGI("MAIN", "Status message: %s\n", status_message);
	esp_websocket_client_send_text(status_websocket_client, status_message, strlen(status_message), portMAX_DELAY);

	// run one thread per pump to fulfill order
	pump_task_args_t pump_args[PUMP_COUNT_SIZE];
	int started_pumps = 0;

	for (int pump_index = 0; pump_index < PUMP_COUNT_SIZE; pump_index++) {
		pump_args[pump_index] = (pump_task_args_t){
			.pin = pump_pins[pump_index],
			.duration_ms = num_pumps[pump_index] * MILLISECONDS_PER_PUMP,
			.completion_semaphore = pump_completion_semaphore,
		};

		if (xTaskCreate(
				pump_task,
				"pump_task",
				2048,
				&pump_args[pump_index],
				5,
				NULL) == pdPASS) {
			started_pumps++;
		} else {
			printf("Failed to create pump task %d\n", pump_index + 1);
		}
	}

	for (int pump_index = 0; pump_index < started_pumps; pump_index++) {
		xSemaphoreTake(pump_completion_semaphore, portMAX_DELAY);
	}
	interrupt_set_machine_state(MACHINE_ONLINE);

	// switch status to online when order is complete
	status_message = "online";
	ESP_LOGI("MAIN", "Status message: %s\n", status_message);
	esp_websocket_client_send_text(status_websocket_client, status_message, strlen(status_message), portMAX_DELAY);
	websocket_free_order(incoming_message);
	}
}