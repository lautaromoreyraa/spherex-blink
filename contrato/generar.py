"""Genera el JSON Schema del contrato y los tipos TS de la web.

Uso, desde la raíz del repo::

    python -m contrato.generar             # schemas + web/src/api/tipos.ts
    python -m contrato.generar --sin-tipos # sólo los schemas

La CI corre lo mismo y falla si lo generado difiere de lo versionado: así un
cambio en los modelos no puede llegar a `develop` sin sus tipos.
"""

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

from contrato.campo import Campo
from contrato.esquema import a_texto, esquema_de, esquema_del_contrato
from contrato.indice import Indice

DIRECTORIO_CONTRATO = Path(__file__).resolve().parent
DIRECTORIO_ESQUEMAS = DIRECTORIO_CONTRATO / "esquemas"
DIRECTORIO_WEB = DIRECTORIO_CONTRATO.parent / "web"


def escribir_esquemas(destino: Path = DIRECTORIO_ESQUEMAS) -> list[Path]:
    """Escribe los tres schemas y devuelve sus rutas."""
    destino.mkdir(parents=True, exist_ok=True)
    archivos = {
        "indice.schema.json": esquema_de(Indice),
        "campo.schema.json": esquema_de(Campo),
        "contrato.schema.json": esquema_del_contrato(),
    }
    rutas = []
    for nombre, esquema in archivos.items():
        ruta = destino / nombre
        # newline="\n": el mismo archivo byte a byte en Windows y en la CI.
        ruta.write_text(a_texto(esquema), encoding="utf-8", newline="\n")
        rutas.append(ruta)
    return rutas


def generar_tipos_ts() -> None:
    """Corre json-schema-to-typescript a través del script de la web."""
    # shutil.which resuelve npm.cmd en Windows, que subprocess no encuentra solo.
    npm = shutil.which("npm")
    if npm is None:
        raise SystemExit("No se encontró npm: hace falta para generar los tipos TS.")
    subprocess.run([npm, "run", "--silent", "generar:tipos"], cwd=DIRECTORIO_WEB, check=True)


def main(argumentos: list[str] | None = None) -> int:
    lector = argparse.ArgumentParser(description=__doc__.splitlines()[0] if __doc__ else None)
    lector.add_argument("--sin-tipos", action="store_true", help="no genera los tipos TS")
    opciones = lector.parse_args(argumentos)

    for ruta in escribir_esquemas():
        print(f"schema: {ruta.relative_to(DIRECTORIO_CONTRATO.parent).as_posix()}")
    if not opciones.sin_tipos:
        generar_tipos_ts()
        print("tipos:  web/src/api/tipos.ts")
    return 0


if __name__ == "__main__":
    sys.exit(main())
