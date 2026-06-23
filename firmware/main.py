# =============================================================
# main.py — Loop principal de LabGate
# Orquesta todos los módulos: WiFi, RFID, API, servo, LEDs,
# buzzer y sensor de puerta abierta.
# =============================================================

from utime import sleep_ms, ticks_ms, ticks_diff

import wifi_manager
import rfid
import leds
import buzzer
import servo
import sensor
import http_client

from config import (
    PUERTA_TIEMPO_ABIERTA,
    PUERTA_ALERTA_TIEMPO,
    RFID_ESPERA_MS
)


# --- Estado global ---
puerta_abierta_desde = None   # ticks_ms() del momento en que se abrió


def abrir_puerta():
    """Abre la puerta: mueve el servo y registra el tiempo de apertura."""
    global puerta_abierta_desde
    servo.abrir()
    puerta_abierta_desde = ticks_ms()


def cerrar_puerta():
    """Cierra la puerta y suelta el servo para evitar vibración."""
    global puerta_abierta_desde
    servo.cerrar()
    sleep_ms(500)
    servo.soltar()
    puerta_abierta_desde = None


def procesar_acceso_concedido():
    """Feedback visual/sonoro y apertura de puerta para acceso válido."""
    leds.indicar_concedido()
    buzzer.beep_concedido()
    abrir_puerta()


def procesar_acceso_denegado():
    """Feedback visual/sonoro para acceso inválido."""
    leds.indicar_denegado()
    buzzer.beep_denegado()
    sleep_ms(2000)
    leds.apagar()


def verificar_puerta():
    """
    Comprueba si la puerta lleva demasiado tiempo abierta.
    Si el HC-SR04 detecta que sigue abierta pasado el umbral,
    emite una alerta sonora.
    """
    global puerta_abierta_desde

    if puerta_abierta_desde is None:
        return

    tiempo_transcurrido_ms = ticks_diff(ticks_ms(), puerta_abierta_desde)
    tiempo_alerta_ms = PUERTA_ALERTA_TIEMPO * 1000

    # Solo verificar después del tiempo de alerta
    if tiempo_transcurrido_ms > tiempo_alerta_ms:
        if sensor.puerta_abierta():
            print("⚠ Alerta: puerta abierta demasiado tiempo")
            buzzer.beep_alerta()

    # Cerrar automáticamente tras el tiempo definido en config
    if tiempo_transcurrido_ms > PUERTA_TIEMPO_ABIERTA:
        cerrar_puerta()
        leds.apagar()


def main():
    print("=== LabGate iniciando ===")

    # 1. Conectar a WiFi
    if not wifi_manager.conectar_wifi():
        print("Error: no se pudo conectar al WiFi")
        # Parpadear LED rojo indefinidamente si no hay WiFi
        while True:
            leds.indicar_denegado()
            sleep_ms(300)
            leds.apagar()
            sleep_ms(300)

    print("WiFi conectado. Sistema listo.")
    leds.apagar()

    # 2. Inicializar lector RFID
    rfid.inicializar()
    print("RFID listo. Esperando tarjeta...")

    # 3. Loop principal
    while True:
        verificar_puerta()

        # Solo leer RFID si la puerta está cerrada
        if puerta_abierta_desde is None:
            if rfid.detectar_tarjeta():
                uid = rfid.leer_uid()

                if uid is not None:
                    print("Tarjeta detectada:", uid)

                    # Enviar UID a la API
                    resultado = http_client.validar_acceso(uid)

                    if resultado is None:
                        # Error de red: indicar con doble beep
                        print("Error al contactar la API")
                        buzzer.beep_denegado()
                        sleep_ms(200)
                        buzzer.beep_denegado()
                    elif resultado["granted"]:
                        print("Acceso concedido:", resultado["description"])
                        procesar_acceso_concedido()
                    else:
                        print("Acceso denegado:", resultado["description"])
                        procesar_acceso_denegado()

                    # Pausa entre lecturas para evitar rebotes
                    sleep_ms(RFID_ESPERA_MS)

        sleep_ms(100)


# Punto de entrada
main()
