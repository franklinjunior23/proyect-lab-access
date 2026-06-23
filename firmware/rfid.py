# =============================================================
# rfid.py — Lector RFID MFRC522 via SPI
# Implementa las operaciones mínimas para leer el UID de una
# tarjeta ISO/IEC 14443A (Mifare Classic, Ultralight, etc.)
# =============================================================

from machine import Pin, SPI
from utime import sleep_ms
from config import (
    PIN_RFID_SCK, PIN_RFID_MOSI, PIN_RFID_MISO,
    PIN_RFID_CS, PIN_RFID_RST
)

# --- Registros del MFRC522 ---
_REG_COMMAND     = 0x01
_REG_COM_IRQ     = 0x04
_REG_ERROR       = 0x06
_REG_FIFO_DATA   = 0x09
_REG_FIFO_LEVEL  = 0x0A
_REG_BIT_FRAMING = 0x0D
_REG_MODE        = 0x11
_REG_TX_CONTROL  = 0x14
_REG_TX_ASK      = 0x15
_REG_CRC_M       = 0x21
_REG_CRC_L       = 0x22
_REG_T_MODE      = 0x2A
_REG_T_PRESCALER = 0x2B
_REG_T_RELOAD_H  = 0x2C
_REG_T_RELOAD_L  = 0x2D

# --- Comandos del MFRC522 ---
_CMD_IDLE        = 0x00
_CMD_CALC_CRC    = 0x03
_CMD_TRANSCEIVE  = 0x0C
_CMD_RESET       = 0x0F

# --- Comandos PICC (tarjeta) ---
_PICC_REQA       = 0x26
_PICC_SEL_CL1    = 0x93

# Instancias de SPI y pines
_spi = SPI(0,
           baudrate=1_000_000,
           polarity=0,
           phase=0,
           sck=Pin(PIN_RFID_SCK),
           mosi=Pin(PIN_RFID_MOSI),
           miso=Pin(PIN_RFID_MISO))

_cs  = Pin(PIN_RFID_CS,  Pin.OUT)
_rst = Pin(PIN_RFID_RST, Pin.OUT)


# --- Funciones de bajo nivel SPI ---

def _escribir_reg(reg, valor):
    """Escribe un byte en el registro del MFRC522."""
    _cs.value(0)
    _spi.write(bytes([(reg << 1) & 0x7E, valor]))
    _cs.value(1)


def _leer_reg(reg):
    """Lee un byte del registro del MFRC522."""
    _cs.value(0)
    _spi.write(bytes([((reg << 1) & 0x7E) | 0x80]))
    datos = _spi.read(1)
    _cs.value(1)
    return datos[0]


def _set_bits(reg, mascara):
    _escribir_reg(reg, _leer_reg(reg) | mascara)


def _clear_bits(reg, mascara):
    _escribir_reg(reg, _leer_reg(reg) & (~mascara))


# --- Inicialización ---

def inicializar():
    """Resetea y configura el módulo MFRC522."""
    _rst.value(1)
    sleep_ms(50)

    _escribir_reg(_REG_COMMAND, _CMD_RESET)
    sleep_ms(50)

    # Configuración del temporizador interno
    _escribir_reg(_REG_T_MODE,      0x80)
    _escribir_reg(_REG_T_PRESCALER, 0xA9)
    _escribir_reg(_REG_T_RELOAD_H,  0x03)
    _escribir_reg(_REG_T_RELOAD_L,  0xE8)

    _escribir_reg(_REG_TX_ASK, 0x40)  # modulación 100% ASK
    _escribir_reg(_REG_MODE,   0x3D)  # CRC preset 0x6363

    # Activar antena
    _set_bits(_REG_TX_CONTROL, 0x03)


# --- Comunicación con tarjeta ---

def _transceive(datos_tx):
    """
    Envía datos a la tarjeta y recibe la respuesta.
    Retorna (True, bytes_respuesta) o (False, None).
    """
    _escribir_reg(_REG_COMMAND, _CMD_IDLE)
    _escribir_reg(_REG_COM_IRQ, 0x7F)       # limpiar flags IRQ
    _set_bits(_REG_FIFO_LEVEL, 0x80)        # flush FIFO

    # Escribir datos en FIFO
    for byte in datos_tx:
        _escribir_reg(_REG_FIFO_DATA, byte)

    _escribir_reg(_REG_COMMAND,     _CMD_TRANSCEIVE)
    _escribir_reg(_REG_BIT_FRAMING, 0x87)   # iniciar transmisión

    # Esperar respuesta con timeout
    timeout = 2000
    while timeout > 0:
        irq = _leer_reg(_REG_COM_IRQ)
        if irq & 0x30:   # RxIRq o IdleIRq → respuesta recibida
            break
        if irq & 0x01:   # TimerIRq → timeout del chip
            return False, None
        timeout -= 1

    _escribir_reg(_REG_BIT_FRAMING, 0x00)

    if _leer_reg(_REG_ERROR) & 0x1B:   # error de buffer, paridad o protocolo
        return False, None

    # Leer bytes del FIFO
    n = _leer_reg(_REG_FIFO_LEVEL)
    respuesta = bytearray()
    for _ in range(n):
        respuesta.append(_leer_reg(_REG_FIFO_DATA))

    return True, respuesta


# --- API pública ---

def detectar_tarjeta():
    """
    Busca si hay una tarjeta en el campo.
    Retorna True si hay una tarjeta presente, False si no.
    """
    _escribir_reg(_REG_BIT_FRAMING, 0x07)
    ok, _ = _transceive([_PICC_REQA])
    return ok


def leer_uid():
    """
    Lee el UID de la tarjeta presente.
    Retorna el UID como string hexadecimal (ej: 'A1B2C3D4')
    o None si no se pudo leer.
    """
    # Anti-colisión: solicitar UID completo
    ok, respuesta = _transceive([_PICC_SEL_CL1, 0x20])

    if not ok or respuesta is None or len(respuesta) < 4:
        return None

    # Los primeros 4 bytes son el UID
    uid_bytes = respuesta[:4]

    # Convertir a string hexadecimal en mayúsculas
    uid_hex = ""
    for byte in uid_bytes:
        uid_hex += "{:02X}".format(byte)

    return uid_hex
