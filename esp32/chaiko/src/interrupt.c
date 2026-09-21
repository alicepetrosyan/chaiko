#include "interrupt.h"
#include <stdint.h>
#include "freertos/queue.h"

static const gpio_num_t button_pins[INTERRUPT_PIN_COUNT] = {
	BUTTON1_PIN,
	BUTTON2_PIN,
	BUTTON3_PIN,
	BUTTON4_PIN,
};

static const gpio_num_t pump_pins[INTERRUPT_PIN_COUNT] = {
	PUMP1_PIN,
	PUMP2_PIN,
	PUMP3_PIN,
	PUMP4_PIN,
};

static QueueHandle_t button_event_queue;
static volatile machine_state_t machine_state = MACHINE_ONLINE;
static volatile bool order_cancelled;

static void IRAM_ATTR button_isr_handler(void *argument);

bool interrupt_init(void)
{
	button_event_queue = xQueueCreate(8, sizeof(button_event_t));
	if (button_event_queue == NULL) {
		return false;
	}

	if (gpio_install_isr_service(0) != ESP_OK) {
		return false;
	}

	for (int button_index = 0; button_index < INTERRUPT_PIN_COUNT; button_index++) {
		gpio_set_intr_type(button_pins[button_index], GPIO_INTR_ANYEDGE);
		if (gpio_isr_handler_add(
				button_pins[button_index],
				button_isr_handler,
				(void *)(intptr_t)button_index) != ESP_OK) {
			return false;
		}
	}

	return true;
}

bool interrupt_get_button_event(button_event_t *event)
{
	return xQueueReceive(button_event_queue, event, 0) == pdTRUE;
}

void interrupt_set_machine_state(machine_state_t state)
{
	machine_state = state;
}

void interrupt_reset_order_cancelled(void)
{
	order_cancelled = false;
}

bool interrupt_order_cancelled(void)
{
	return order_cancelled;
}

static void IRAM_ATTR button_isr_handler(void *argument)
{
	int pump_index = (int)(intptr_t)argument;
	bool pressed = gpio_get_level(button_pins[pump_index]) == 1;

	if (machine_state == MACHINE_FULFILLING_ORDER && pressed) {
		order_cancelled = true;
		for (int index = 0; index < INTERRUPT_PIN_COUNT; index++) {
			gpio_set_level(pump_pins[index], 0);
		}
		return;
	}

	if (machine_state == MACHINE_ONLINE || machine_state == MACHINE_MANUAL_DISPENSE) {
		button_event_t event = {
			.pump_index = pump_index,
			.pressed = pressed,
		};
		BaseType_t higher_priority_task_woken = pdFALSE;
		xQueueSendFromISR(button_event_queue, &event, &higher_priority_task_woken);
		portYIELD_FROM_ISR(higher_priority_task_woken);
	}
}
