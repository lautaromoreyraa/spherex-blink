"""Los campos versionados en web/public/datos cumplen el contrato y el SRS.

Corren en la CI sin red, sobre los archivos que generó el pipeline: RF-09
(schema y rutas), RF-04 (alineación medida con estrellas fijas), RF-05
(escala común y peso), RF-32 (Makemake), RNF-02 (peso por campo) y RNF-07
(procedencia de cada época).
"""

import json
import math
from pathlib import Path
from typing import Any

import pytest
from jsonschema import Draft202012Validator

from contrato.campo import Campo
from contrato.indice import Indice
from core.epocas import pasada_de
from core.estiramiento import PARAMETRO_ASINH
from core.rejilla import rejilla_norte_arriba

RAIZ = Path(__file__).resolve().parents[2]
DATOS = RAIZ / "web" / "public" / "datos"
ESQUEMAS = RAIZ / "contrato" / "esquemas"
MAXIMO_POR_CAMPO = 6 * 1024 * 1024
MAXIMO_POR_WEBP = 400 * 1024


def _leer(ruta: Path) -> Any:
    return json.loads(ruta.read_text(encoding="utf-8"))


def _validador(nombre: str) -> Draft202012Validator:
    return Draft202012Validator(
        _leer(ESQUEMAS / nombre), format_checker=Draft202012Validator.FORMAT_CHECKER
    )


def _indice() -> Indice:
    return Indice.model_validate(_leer(DATOS / "indice.json"))


def _campos() -> list[Campo]:
    return [
        Campo.model_validate(_leer(DATOS / "campos" / c.id / "campo.json"))
        for c in _indice().campos
    ]


def _campo(identificador: str) -> Campo:
    return Campo.model_validate(_leer(DATOS / "campos" / identificador / "campo.json"))


def test_estan_barnard_y_makemake() -> None:
    assert {c.id for c in _indice().campos} >= {"estrella-de-barnard", "makemake"}


def test_todos_los_json_validan_contra_el_schema() -> None:
    errores = [
        e.message
        for e in _validador("indice.schema.json").iter_errors(_leer(DATOS / "indice.json"))
    ]
    for ruta in sorted((DATOS / "campos").glob("*/campo.json")):
        errores += [
            f"{ruta.parent.name}: {e.message}"
            for e in _validador("campo.schema.json").iter_errors(_leer(ruta))
        ]

    assert errores == []


def test_toda_ruta_citada_existe() -> None:
    rutas = [c.miniatura for c in _indice().campos]
    for campo in _campos():
        rutas += [r for r in (campo.referencia, campo.rastro) if r is not None]
        rutas += [e.imagen for e in campo.epocas]
        rutas += [e.diferencia for e in campo.epocas if e.diferencia is not None]

    faltan = [r for r in rutas if not (DATOS / r).is_file()]

    assert faltan == []


def test_no_hay_fits_ni_archivos_sueltos() -> None:
    extensiones = {p.suffix for p in DATOS.rglob("*") if p.is_file()}

    assert extensiones <= {".json", ".webp"}


@pytest.mark.parametrize("identificador", ["estrella-de-barnard", "makemake"])
def test_cada_campo_pesa_hasta_6_mb_y_cada_webp_hasta_400_kb(identificador: str) -> None:
    archivos = [p for p in (DATOS / "campos" / identificador).iterdir() if p.is_file()]

    assert sum(p.stat().st_size for p in archivos) <= MAXIMO_POR_CAMPO
    assert all(p.stat().st_size <= MAXIMO_POR_WEBP for p in archivos if p.suffix == ".webp")


def test_la_rejilla_del_json_es_la_misma_para_todas_las_epocas() -> None:
    # Hay una sola cabecera WCS por campo y todas las épocas se escribieron
    # sobre ella: se comprueba que coincide con la que arma el pipeline.
    for campo in _campos():
        rejilla = rejilla_norte_arriba(campo.centro, campo.tamano_grados)
        assert campo.rejilla.wcs == rejilla.cabecera()
        assert (campo.rejilla.ancho_px, campo.rejilla.alto_px) == (rejilla.ancho, rejilla.alto)


def test_en_cada_epoca_al_menos_3_estrellas_fijas_caen_a_menos_de_1_px() -> None:
    for campo in _campos():
        control = [c for c in campo.conocidos if c.fuente == "Gaia DR3"]
        for epoca in campo.epocas:
            medidas = [d for c in control for d in c.deteccion if d.epoca_id == epoca.id]
            assert len(medidas) >= 3, f"{campo.id} {epoca.id}"
            assert all(d.distancia_px < 1 for d in medidas), f"{campo.id} {epoca.id}"


def test_toda_epoca_sale_de_un_archivo_de_irsa() -> None:
    for campo in _campos():
        for epoca in campo.epocas:
            assert epoca.fuente.uri.startswith("https://irsa.ipac.caltech.edu/")
            assert epoca.fuente.uri.endswith(".fits")
            assert epoca.pasada == pasada_de(epoca.mjd)


def test_barnard_se_corre_entre_pasadas_y_el_campo_lo_avisa() -> None:
    campo = _campo("estrella-de-barnard")
    barnard = campo.conocidos[0]
    primera, ultima = barnard.posiciones[0], barnard.posiciones[-1]
    corrimiento = math.hypot(ultima.x - primera.x, ultima.y - primera.y)

    assert barnard.nombre == "Estrella de Barnard"
    assert barnard.fuente == "SIMBAD"
    assert len({e.pasada for e in campo.epocas}) >= 2
    assert len(campo.epocas) >= 3
    assert corrimiento > 1.5
    if corrimiento < 2:
        assert any("se corre" in a.es for a in campo.avisos)


def test_makemake_se_mueve_y_se_detecta_en_una_misma_pasada() -> None:
    campo = _campo("makemake")
    makemake = campo.conocidos[0]
    pasadas = {e.pasada for e in campo.epocas}
    dentro = [p for p in makemake.posiciones if p.dentro_del_campo]
    corrimiento = math.hypot(dentro[-1].x - dentro[0].x, dentro[-1].y - dentro[0].y)
    buenas = [d for d in makemake.deteccion if d.snr >= 5 and d.distancia_px < 1]

    assert makemake.nombre == "Makemake"
    assert makemake.fuente == "Horizons"
    assert all(p.distancia_ua is not None for p in makemake.posiciones)
    assert len(pasadas) == 1
    assert len(dentro) >= 3
    assert corrimiento >= 2
    assert len(buenas) >= 3


def test_makemake_trae_la_geometria_de_cada_epoca() -> None:
    campo = _campo("makemake")
    ids = [e.id for e in campo.epocas]

    assert campo.geometria is not None
    assert campo.geometria.marco == "heliocentrico-ecliptico-J2000"
    assert [p.epoca_id for p in campo.geometria.tierra] == ids
    assert [p.epoca_id for p in campo.geometria.objeto.posiciones] == ids
    for tierra, objeto in zip(
        campo.geometria.tierra, campo.geometria.objeto.posiciones, strict=True
    ):
        assert math.hypot(tierra.x_ua, tierra.y_ua, tierra.z_ua) == pytest.approx(1.0, abs=0.02)
        assert 50 < math.hypot(objeto.x_ua, objeto.y_ua, objeto.z_ua) < 55
    assert _campo("estrella-de-barnard").geometria is None


def test_las_epocas_de_cada_campo_comparten_el_estiramiento() -> None:
    for campo in _campos():
        assert campo.estiramiento.tipo == "asinh"
        assert campo.estiramiento.maximo > campo.estiramiento.minimo
        assert campo.estiramiento.parametro_asinh == PARAMETRO_ASINH


def test_el_visor_puede_volver_a_mjy_sr_en_la_diferencia_y_ver_el_rastro() -> None:
    # RF-37: sin el límite de la diferencia el visor no puede rotular su escala.
    for campo in _campos():
        assert campo.escala_diferencia is not None, campo.id
        assert campo.escala_diferencia.tipo == "lineal-simetrica"
        assert campo.escala_diferencia.limite > 0
        assert campo.rastro is not None, campo.id


@pytest.mark.red
def test_los_archivos_de_irsa_citados_existen() -> None:
    import httpx2

    with httpx2.Client(timeout=60, follow_redirects=True) as cliente:
        for campo in _campos():
            uri = campo.epocas[0].fuente.uri
            respuesta = cliente.head(uri)
            assert respuesta.status_code == 200, uri
