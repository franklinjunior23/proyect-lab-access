# =============================================================
# sensor.py — Sensor ultrasónico HC-SR04
# Mide la distancia usando el tiempo de vuelo del ultrasonido:
#   distancia (cm) = (tiempo_echo_us / 2) / 29.1
# =============================================================

from machine import Pin
from utime import sleep_us, ticks_us, ticks_diff
from config import PIN_TRIG, PIN_ECHO, PUERTA_ALERTA_CM

_trig = Pin(PIN_TRIG, Pin.OUT)
_echo = Pin(PIN_ECHO, Pin.IN)

# Tiempo límite en µs equivalente a ~40 cm (evita que el loop quede colgado)
_TIEMPO_LIMITE_US = 23200


def medir_distancia_cm():
    """
    Dispara un pulso y mide el eco.
    Retorna la distancia en cm, o None si no se recibe eco a tiempo.
    """
    # Pulso de disparo: mínimo 10 µs en HIGH
    _trig.value(0)
    sleep_us(2)
    _trig.value(1)
    sleep_us(10)
    _trig.value(0)

    # Espera que el eco suba a HIGH
    inicio = ticks_us()
    while _echo.value() == 0:
        if ticks_diff(ticks_us(), inicio) > _TIEMPO_LIMITE_US:
            return None

    # Mide cuánto tiempo permanece HIGH el eco
    subida = ticks_us()
    while _echo.value() == 1:
        if ticks_diff(ticks_us(), subida) > _TIEMPO_LIMITE_US:
            return None
    bajada = ticks_us()

    duracion_us = ticks_diff(bajada, subida)
    distancia_cm = duracion_us / 58.0  # fórmula: (us / 2) / 29.1
    return round(distancia_cm, 1)


def puerta_abierta():
    """
    Retorna True si el sensor detecta que la puerta está abierta
    (objeto cercano al umbral definido en config).
    """
    distancia = medir_distancia_cm()

    if distancia is None:
        return False  # sin lectura válida, se asume cerrada

    return distancia < PUERTA_ALERTA_CM
