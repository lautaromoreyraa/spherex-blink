"""Caché en disco de recortes y consultas.

Cada respuesta se guarda bajo el hash de lo que se pidió. Con la caché llena,
una segunda corrida del pipeline no sale a la red (RF-02) y da los mismos
archivos (RNF-12), porque también las consultas a catálogos se leen de acá con
la fecha en que se hicieron.
"""

import hashlib
import json
import os
from pathlib import Path
from typing import Any


class CacheEnDisco:
    def __init__(self, directorio: Path) -> None:
        self.directorio = directorio

    def ruta(self, espacio: str, clave: str, extension: str) -> Path:
        """Archivo de una clave; el hash evita caracteres inválidos en Windows."""
        resumen = hashlib.sha256(clave.encode("utf-8")).hexdigest()
        return self.directorio / espacio / f"{resumen}{extension}"

    def leer_bytes(self, espacio: str, clave: str, extension: str = ".bin") -> bytes | None:
        ruta = self.ruta(espacio, clave, extension)
        return ruta.read_bytes() if ruta.is_file() else None

    def guardar_bytes(
        self, espacio: str, clave: str, datos: bytes, extension: str = ".bin"
    ) -> Path:
        ruta = self.ruta(espacio, clave, extension)
        ruta.parent.mkdir(parents=True, exist_ok=True)
        # Se escribe en un temporal y se renombra: si el proceso muere a la
        # mitad no queda un archivo cortado que la próxima corrida tome como
        # bueno.
        temporal = ruta.with_suffix(ruta.suffix + f".{os.getpid()}.tmp")
        temporal.write_bytes(datos)
        temporal.replace(ruta)
        return ruta

    def leer_json(self, espacio: str, clave: str) -> Any:
        datos = self.leer_bytes(espacio, clave, ".json")
        return None if datos is None else json.loads(datos.decode("utf-8"))

    def guardar_json(self, espacio: str, clave: str, valor: Any) -> Path:
        texto = json.dumps(valor, ensure_ascii=False, sort_keys=True, indent=1)
        return self.guardar_bytes(espacio, clave, texto.encode("utf-8"), ".json")
