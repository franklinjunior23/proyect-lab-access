# =============================================================
# servo.py — Control del servomotor SG90
# El SG90 usa PWM a 50 Hz. El ancho del pulso determina el ángulo:
#   0°   → ~0.5 ms  → duty_u16 ≈ 1638
#   90°  → ~1.5 ms  → duty_u16 ≈ 4915
#   180° → ~2.5 ms  → duty_u16 ≈ 8192
# =============================================================

from machine import Pin, PWM
from utime import sleep_ms
from config import PIN_SERVO, SERVO_ANGULO_ABIERTO, SERVO_ANGULO_CERRADO

_pwm = PWM(Pin(PIN_SERVO))
_pwm.freq(50)


def _angulo_a_duty(angulo):
    """Convierte un ángulo (0-180°) al valor duty_u16 correspondiente."""
    # Pulso mínimo 0.5 ms, máximo 2.5 ms, período 20 ms
    pulso_ms = 0.5 + (angulo / 180.0) * 2.0
    return int((pulso_ms / 20.0) * 65535)


def abrir():
    """Gira el servo al ángulo de apertura definido en config."""
    _pwm.duty_u16(_angulo_a_duty(SERVO_ANGULO_ABIERTO))


def cerrar():
    """Gira el servo al ángulo de cierre definido en config."""
    _pwm.duty_u16(_angulo_a_duty(SERVO_ANGULO_CERRADO))


def soltar():
    """Desactiva el PWM para evitar vibración cuando está en reposo."""
    _pwm.duty_u16(0)
