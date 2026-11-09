"""Regenera los campos de la demo en `web/public/datos/` (RNF-12).

Uso, desde la raíz del repo::

    python -m pipeline                       # todos los campos
    python -m pipeline --campo makemake      # sólo uno (el índice se rearma igual)
    python -m pipeline --salida otra/carpeta

Lo que baja de IRSA, SIMBAD y Horizons queda en la caché (`cache/`, o la
carpeta de `SPHEREX_BLINK_CACHE`): con la caché llena, la corrida no sale a
la red y da los mismos archivos salvo `generado_en`.
"""

import argparse
import logging
import sys
from datetime import UTC, datetime
from pathlib import Path

from contrato import VERSION_CONTRATO
from contrato.indice import Indice, ResumenDeCampo
from core.cache import CacheEnDisco
from core.configuracion import configuracion_desde_entorno
from core.red import crear_cliente
from pipeline.armado import Contexto, armar_campo
from pipeline.campos import CAMPOS
from pipeline.escritura import escribir_documento

RAIZ = Path(__file__).resolve().parent.parent
SALIDA_POR_DEFECTO = RAIZ / "web" / "public" / "datos"

registro = logging.getLogger("pipeline")


def main(argumentos: list[str] | None = None) -> int:
    lector = argparse.ArgumentParser(
        prog="python -m pipeline", description=__doc__.splitlines()[0] if __doc__ else None
    )
    lector.add_argument(
        "--campo",
        action="append",
        choices=[c.id for c in CAMPOS],
        help="campo a regenerar (se puede repetir)",
    )
    lector.add_argument(
        "--salida", type=Path, default=SALIDA_POR_DEFECTO, help="carpeta datos/ de la web"
    )
    opciones = lector.parse_args(argumentos)
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")

    configuracion = configuracion_desde_entorno()
    cache = CacheEnDisco(configuracion.directorio_cache)
    salida: Path = opciones.salida
    pedidos = set(opciones.campo or [c.id for c in CAMPOS])

    with crear_cliente(configuracion.tiempo_maximo_s, configuracion.pedidos_simultaneos) as cliente:
        contexto = Contexto(
            cliente=cliente, configuracion=configuracion, cache=cache, salida=salida
        )
        resumenes: list[ResumenDeCampo] = []
        for definicion in CAMPOS:
            ruta_del_campo = salida / "campos" / definicion.id / "campo.json"
            if definicion.id in pedidos:
                registro.info("armando %s", definicion.id)
                generado = armar_campo(definicion, contexto)
                resumenes.append(generado.resumen)
                registro.info(
                    "%s: %d épocas, %d avisos",
                    definicion.id,
                    len(generado.campo.epocas),
                    len(generado.campo.avisos),
                )
            elif ruta_del_campo.is_file():
                resumenes.append(_resumen_existente(ruta_del_campo))

    indice = Indice(
        version_contrato=VERSION_CONTRATO,
        generado_en=datetime.now(UTC).replace(microsecond=0),
        campos=resumenes,
    )
    escribir_documento(indice, salida / "indice.json")
    registro.info("índice con %d campos en %s", len(resumenes), salida)
    return 0


def _resumen_existente(ruta: Path) -> ResumenDeCampo:
    """El resumen de un campo que no se regeneró en esta corrida, desde su campo.json."""
    from contrato.campo import Campo

    campo = Campo.model_validate_json(ruta.read_text(encoding="utf-8"))
    destacado = next((c.nombre for c in campo.conocidos), None)
    return ResumenDeCampo(
        id=campo.id,
        nombre=campo.nombre,
        centro=campo.centro,
        tamano_grados=campo.tamano_grados,
        detector=campo.detector,
        cantidad_epocas=len(campo.epocas),
        objeto_destacado=destacado,
        miniatura=f"campos/{campo.id}/miniatura.webp",
    )


if __name__ == "__main__":
    sys.exit(main())
