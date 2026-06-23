# =============================================================
# config.py — Configuración central de LabGate (Pico W)
# Todos los módulos importan desde aquí. Si cambias un pin
# o una URL, lo cambias en un solo lugar.
# =============================================================

# --- WiFi ---
WIFI_SSID     = "TU_RED_WIFI"
WIFI_PASSWORD = "TU_CONTRASENA"

# --- Backend ---
# Usa la IP local de tu PC, no localhost (el Pico no se conoce a sí mismo)
API_URL = "http://192.168.1.100:3001"

# --- Pines de LEDs ---
PIN_LED_VERDE = 15
PIN_LED_ROJO  = 14

# --- Pin del Buzzer activo ---
PIN_BUZZER = 13

# --- Pin del Servo SG90 (PWM) ---
PIN_SERVO = 12

# --- Pines RFID MFRC522 (SPI0) ---
PIN_RFID_SCK  = 18
PIN_RFID_MOSI = 19
PIN_RFID_MISO = 16
PIN_RFID_CS   = 17
PIN_RFID_RST  = 20

# --- Pines HC-SR04 ---
PIN_TRIG = 3
PIN_ECHO = 2

# --- Tiempos (en milisegundos salvo indicación) ---
SERVO_ANGULO_ABIERTO  = 90   # grados
SERVO_ANGULO_CERRADO  = 0    # grados
PUERTA_TIEMPO_ABIERTA = 4000 # ms que permanece abierta tras acceso concedido
PUERTA_ALERTA_CM      = 20   # si el sensor detecta < X cm → puerta sigue abierta
PUERTA_ALERTA_TIEMPO  = 10   # segundos antes de emitir alerta de puerta abierta
BUZZER_CORTO_MS       = 150  # beep de acceso concedido
BUZZER_LARGO_MS       = 600  # beep de acceso denegado

# --- RFID ---
RFID_ESPERA_MS = 500  # ms entre lecturas para evitar rebotes
