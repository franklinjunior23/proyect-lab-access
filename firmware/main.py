# =============================================================
# main.py — Loop principal de LabGate
# Orquesta todos los módulos: WiFi, RFID, API, servo, LEDs,
# buzzer y sensor de puerta (cierre inteligente por detección).
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
    PUERTA_ESPERA_ENTRADA_MS,
    PUERTA_ALERTA_TIEMPO,
    RFID_ESPERA_MS
)

# --- Estados de la puerta ---
_CERRADA           = 0
_ESPERANDO_ENTRADA = 1   # puerta abierta, esperando que la persona llegue al umbral
_PERSONA_PASANDO   = 2   # persona detectada cruzando el umbral

# --- Estado global ---
estado_puerta       = _CERRADA
tiempo_estado_ms    = None   # ticks_ms() del último cambio de estado
personas_ingresadas = 0      # contador de personas que ingresaron con acceso
ultima_alerta_ms    = None   # para no emitir alerta continuamente


# --- Control de puerta ---

def _abrir_puerta():
    """Abre la puerta y registra el momento de apertura."""
    global estado_puerta, tiempo_estado_ms
    servo.abrir()
    estado_puerta    = _ESPERANDO_ENTRADA
    tiempo_estado_ms = ticks_ms()


def _cerrar_puerta():
    """Cierra la puerta, suelta el servo y vuelve al estado cerrado."""
    global estado_puerta, tiempo_estado_ms, ultima_alerta_ms
    servo.cerrar()
    sleep_ms(500)
    servo.soltar()
    leds.apagar()
    estado_puerta    = _CERRADA
    tiempo_estado_ms = None
    ultima_alerta_ms = None


# --- Feedback de acceso ---

def procesar_acceso_concedido():
    """Feedback visual/sonoro y apertura de puerta para acceso válido."""
    leds.indicar_concedido()
    buzzer.beep_concedido()
    _abrir_puerta()


def procesar_acceso_denegado():
    """Feedback visual/sonoro para acceso inválido."""
    leds.indicar_denegado()
    buzzer.beep_denegado()
    sleep_ms(2000)
    leds.apagar()


# --- Lógica de cierre inteligente ---

def verificar_puerta():
    """
    Máquina de estados para la puerta:

      CERRADA → [acceso concedido] → ESPERANDO_ENTRADA
        - Si detecta persona: → PERSONA_PASANDO
        - Si se agota el tiempo sin nadie: → CERRADA (auto-cierre)

      ESPERANDO_ENTRADA → [sensor detecta persona] → PERSONA_PASANDO
        - La persona cruza el umbral (distancia < PUERTA_ALERTA_CM).

      PERSONA_PASANDO → [sensor deja de detectar] → CERRADA
        - La persona ya pasó → cuenta +1 y cierra la puerta.
        - Si tarda más de PUERTA_ALERTA_TIEMPO → alerta sonora periódica.
    """
    global estado_puerta, tiempo_estado_ms, personas_ingresadas, ultima_alerta_ms

    if estado_puerta == _CERRADA:
        return

    transcurrido_ms = ticks_diff(ticks_ms(), tiempo_estado_ms)
    hay_persona     = sensor.puerta_abierta()

    # ── Estado: puerta abierta, nadie ha llegado aún ──────────────────
    if estado_puerta == _ESPERANDO_ENTRADA:
        if hay_persona:
            # Persona llegó al umbral → empieza a cruzar
            print("Persona detectada cruzando...")
            estado_puerta    = _PERSONA_PASANDO
            tiempo_estado_ms = ticks_ms()

        elif transcurrido_ms > PUERTA_ESPERA_ENTRADA_MS:
            # Nadie llegó en el tiempo esperado → cerrar
            print("Nadie cruzó la puerta. Cerrando.")
            _cerrar_puerta()

    # ── Estado: persona en el umbral, esperando que termine de pasar ──
    elif estado_puerta == _PERSONA_PASANDO:
        if not hay_persona:
            # Persona dejó de ser detectada → ya pasó completamente
            personas_ingresadas += 1
            print("Persona ingresó al laboratorio.")
            print("Total de personas en laboratorio:", personas_ingresadas)
            _cerrar_puerta()

        else:
            # Persona sigue en el umbral: verificar si lleva demasiado tiempo
            if transcurrido_ms > PUERTA_ALERTA_TIEMPO * 1000:
                ahora = ticks_ms()
                intervalo_alerta = 3000  # beep de alerta cada 3 segundos
                if ultima_alerta_ms is None or ticks_diff(ahora, ultima_alerta_ms) > intervalo_alerta:
                    print("Alerta: persona bloqueando la puerta")
                    buzzer.beep_alerta()
                    ultima_alerta_ms = ahora


# --- Programa principal ---

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
    print("Personas en laboratorio:", personas_ingresadas)

    # 3. Loop principal
    while True:
        # Monitorear estado de la puerta en cada iteración
        verificar_puerta()

        # Solo leer RFID si la puerta está cerrada
        if estado_puerta == _CERRADA:
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

        # Polling frecuente para detectar paso de persona a tiempo
        sleep_ms(50)


# Punto de entrada
main()
