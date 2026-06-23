# =============================================================
# http_client.py — Comunicación con la API de LabGate
# Usa urequests (disponible en MicroPython para Pico W).
# =============================================================

import urequests
import ujson
from config import API_URL


def validar_acceso(uid):
    """
    Envía el UID al backend y retorna si el acceso fue concedido.

    Args:
        uid (str): UID de la tarjeta RFID en formato hexadecimal.

    Returns:
        dict con {"granted": bool, "description": str}
        o None si la petición falló.
    """
    url     = API_URL + "/access"
    payload = ujson.dumps({"uid": uid})
    headers = {"Content-Type": "application/json"}

    try:
        response = urequests.post(url, data=payload, headers=headers)

        if response.status_code == 200 or response.status_code == 201:
            datos = response.json()
            response.close()

            # Extraer el resultado del log que devuelve el backend
            granted     = datos.get("granted", False)
            descripcion = datos.get("log", {}).get("description", "")
            return {"granted": granted, "description": descripcion}
        else:
            response.close()
            return None

    except Exception as e:
        print("Error HTTP:", e)
        return None
