# =============================================================
# buzzer.py — Control del buzzer activo
# El buzzer activo solo necesita señal HIGH/LOW (no PWM).
# =============================================================

from machine import Pin
from utime import sleep_ms
from config import PIN_BUZZER, BUZZER_CORTO_MS, BUZZER_LARGO_MS

_buzzer = Pin(PIN_BUZZER, Pin.OUT)


def _beep(duracion_ms):
    """Emite un beep de la duración indicada en ms."""
    _buzzer.value(1)
    sleep_ms(duracion_ms)
    _buzzer.value(0)


def beep_concedido():
    """Beep corto: acceso concedido."""
    _beep(BUZZER_CORTO_MS)


def beep_denegado():
    """Beep largo: acceso denegado."""
    _beep(BUZZER_LARGO_MS)


def beep_alerta():
    """Tres beeps cortos: alerta de puerta abierta demasiado tiempo."""
    for _ in range(3):
        _beep(BUZZER_CORTO_MS)
        sleep_ms(100)
