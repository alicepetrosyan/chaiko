#ifndef INTERRUPT_H
#define INTERRUPT_H

#include <stdbool.h>

#include "driver/gpio.h"
#include "freertos/FreeRTOS.h"

#define BUTTON1_PIN 27
#define BUTTON2_PIN 26
#define BUTTON3_PIN 25
#define BUTTON4_PIN 33

#define PUMP1_PIN 17
#define PUMP2_PIN 18
#define PUMP3_PIN 19
#define PUMP4_PIN 21

#define INTERRUPT_PIN_COUNT 4

typedef enum {
	MACHINE_ONLINE,
	MACHINE_FULFILLING_ORDER,
	MACHINE_MANUAL_DISPENSE,
} machine_state_t;

typedef struct {
	int pump_index;
	bool pressed;
} button_event_t;

bool interrupt_init(void);
bool interrupt_get_button_event(button_event_t *event);
void interrupt_set_machine_state(machine_state_t state);
void interrupt_reset_order_cancelled(void);
bool interrupt_order_cancelled(void);

#endif
