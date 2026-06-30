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
    url      = API_URL + "/access"
    cuerpo   = ujson.dumps({"uid": uid})
    cabeceras = {"Content-Type": "application/json"}

    try:
        respuesta = urequests.post(url, data=cuerpo, headers=cabeceras)

        if respuesta.status_code == 200 or respuesta.status_code == 201:
            datos = respuesta.json()
            respuesta.close()

            # Extraer el resultado del log que devuelve el backend
            concedido   = datos.get("granted", False)
            descripcion = datos.get("log", {}).get("description", "")
            return {"granted": concedido, "description": descripcion}
        else:
            respuesta.close()
            return None

    except Exception as error:
        print("Error HTTP:", error)
        return None
