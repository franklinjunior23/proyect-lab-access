# =============================================================
# leds.py — Control de LEDs verde y rojo
# =============================================================

from machine import Pin
from config import PIN_LED_VERDE, PIN_LED_ROJO

# Inicialización de pines como salida
_led_verde = Pin(PIN_LED_VERDE, Pin.OUT)
_led_rojo  = Pin(PIN_LED_ROJO,  Pin.OUT)


def indicar_concedido():
    """Enciende LED verde y apaga el rojo."""
    _led_verde.value(1)
    _led_rojo.value(0)


def indicar_denegado():
    """Enciende LED rojo y apaga el verde."""
    _led_rojo.value(1)
    _led_verde.value(0)


def apagar():
    """Apaga ambos LEDs. Estado de reposo."""
    _led_verde.value(0)
    _led_rojo.value(0)
