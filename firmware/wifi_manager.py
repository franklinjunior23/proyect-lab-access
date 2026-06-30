# =============================================================
# wifi_manager.py — Gestión de conexión WiFi
# =============================================================

import network
from utime import sleep_ms, ticks_ms, ticks_diff
from config import WIFI_SSID, WIFI_PASSWORD

_TIEMPO_LIMITE_MS = 15000  # tiempo máximo de espera para conectar
_INTERVALO_MS     = 500    # intervalo entre comprobaciones de estado


def conectar_wifi():
    """
    Conecta el Pico W a la red WiFi definida en config.

    Returns:
        True si la conexión fue exitosa, False si se agotó el tiempo.
    """
    red_wifi = network.WLAN(network.STA_IF)
    red_wifi.active(True)

    if red_wifi.isconnected():
        print("WiFi ya conectado:", red_wifi.ifconfig()[0])
        return True

    print("Conectando a WiFi:", WIFI_SSID)
    red_wifi.connect(WIFI_SSID, WIFI_PASSWORD)

    inicio = ticks_ms()
    while not red_wifi.isconnected():
        if ticks_diff(ticks_ms(), inicio) > _TIEMPO_LIMITE_MS:
            print("Timeout: no se pudo conectar al WiFi")
            return False

        print(".")
        sleep_ms(_INTERVALO_MS)

    direccion_ip = red_wifi.ifconfig()[0]
    print("Conectado. IP:", direccion_ip)
    return True


def validar_conexion():
    """
    Verifica si el Pico W sigue conectado al WiFi.

    Returns:
        True si hay conexión activa, False si se perdió.
    """
    red_wifi = network.WLAN(network.STA_IF)

    if red_wifi.isconnected():
        return True

    print("Conexión WiFi perdida. Reconectando...")
    return conectar_wifi()
