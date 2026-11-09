"""Un campo de punta a punta contra servicios simulados (RF-09, RF-32, RNF-12)."""

import json
import math
import re
from pathlib import Path
from urllib.parse import parse_qs

import httpx2
import pytest
from jsonschema import Draft202012Validator

from contrato.campo import Campo
from contrato.comunes import TextoTraducido
from core.cache import CacheEnDisco
from pipeline.armado import Contexto, armar_campo
from pipeline.campos import CuerpoDestacado, DefinicionDeCampo
from tests.fixture.servicios import configuracion_de_prueba, votable
from tests.fixture.sinteticos import Fuente, mef_sintetico

ESQUEMA = Path(__file__).resolve().parents[2] / "contrato" / "esquemas" / "campo.schema.json"
MJDS = [61200.0, 61200.5, 61201.0, 61201.5]
FIJAS = [(200.012, 20.006), (199.99, 19.992), (200.006, 19.99)]


def _cuerpo_en(mjd: float) -> tuple[float, float]:
    return 200.0 + 0.004 * (mjd - 61200.75), 20.0 - 0.001 * (mjd - 61200.75)


def _mjds_de(tlist: str) -> list[float]:
    return [float(t.strip("'")) - 2400000.5 for t in tlist.split()]


def _horizons(params: dict[str, str]) -> str:
    filas = []
    for mjd in _mjds_de(params["TLIST"]):
        if params["EPHEM_TYPE"] == "OBSERVER":
            ra, dec = _cuerpo_en(mjd)
            filas.append(f" 2026-Jun-09 00:00:00.000, , , {ra:.9f}, {dec:.9f}, 50.123, 1.0,")
        else:
            x = 1.0 if params["COMMAND"] == "'399'" else 40.0
            filas.append(f"{mjd + 2400000.5:.9f}, A.D. 2026-Jun-09, {x}, {mjd / 1e5:.6f}, 0.0,")
    return "encabezado\n$$SOE\n" + "\n".join(filas) + "\n$$EOE\npie\n"


def _servicios(pedidos: list[str]) -> httpx2.MockTransport:
    def responder(pedido: httpx2.Request) -> httpx2.Response:
        pedidos.append(str(pedido.url))
        if pedido.url.host == "horizons.prueba":
            params = dict(pedido.url.params)
            return httpx2.Response(200, json={"result": _horizons(params)})
        if pedido.url.path == "/TAP/sync":
            consulta = parse_qs(pedido.content.decode())["QUERY"][0]
            if "gaia_dr3_source" in consulta:
                return httpx2.Response(
                    200,
                    content=votable(
                        [
                            ("source_id", "long"),
                            ("ra", "double"),
                            ("dec", "double"),
                            ("pmra", "double"),
                            ("pmdec", "double"),
                            ("parallax", "double"),
                            ("radial_velocity", "double"),
                            ("phot_g_mean_mag", "double"),
                        ],
                        [
                            [i + 1, ra, dec, 1.0, -2.0, 0.5, None, 12.0 + i]
                            for i, (ra, dec) in enumerate(FIJAS)
                        ],
                    ),
                )
            return httpx2.Response(
                200,
                content=votable(
                    [
                        ("planeid", "char"),
                        ("uri", "char"),
                        ("time_bounds_lower", "double"),
                        ("energy_bandpassname", "char"),
                        ("provenance_version", "char"),
                    ],
                    [
                        [f"plano-{i}", f"ibe/data/obs{i}.fits", mjd, "SPHEREx-D1", "6.5"]
                        for i, mjd in enumerate(MJDS)
                    ],
                ),
            )
        if pedido.url.path.startswith("/ibe/data/obs"):
            indice = int(re.search(r"obs(\d+)", pedido.url.path).group(1))  # type: ignore[union-attr]
            ra, dec = (float(v.rstrip("d")) for v in pedido.url.params["center"].split(","))
            lado = math.ceil(float(pedido.url.params["size"].rstrip("d")) * 3600 / 6.15)
            cuerpo = _cuerpo_en(MJDS[indice])
            fuentes = [Fuente(*cuerpo, 1.0)] + [Fuente(r, d, 4.0) for r, d in FIJAS]
            return httpx2.Response(
                200,
                content=mef_sintetico(
                    ra,
                    dec,
                    lado=lado,
                    rotacion_grados=20.0 * indice,
                    fuentes=fuentes,
                    ruido=0.02,
                    semilla=indice,
                ),
            )
        return httpx2.Response(404)

    return httpx2.MockTransport(responder)


DEFINICION = DefinicionDeCampo(
    id="cuerpo-de-prueba",
    nombre=TextoTraducido(es="Cuerpo de prueba", en="Test body"),
    descripcion=TextoTraducido(es="Datos simulados.", en="Simulated data."),
    tamano_grados=0.05,
    detector="D1",
    destacado=CuerpoDestacado(comando_horizons="999;", nombre="Cuerpo", tipo="tno"),
    maximo_por_pasada=9,
    mjd_desde=61199.5,
    mjd_hasta=61202.0,
)


def _armar(tmp_path: Path, salida: Path, pedidos: list[str]) -> Campo:
    with httpx2.Client(transport=_servicios(pedidos)) as cliente:
        contexto = Contexto(
            cliente=cliente,
            configuracion=configuracion_de_prueba(tmp_path / "cache"),
            cache=CacheEnDisco(tmp_path / "cache"),
            salida=salida,
        )
        return armar_campo(DEFINICION, contexto).campo


@pytest.fixture(scope="module")
def corrida(tmp_path_factory: pytest.TempPathFactory) -> tuple[Path, Campo, list[str]]:
    raiz = tmp_path_factory.mktemp("pipeline")
    pedidos: list[str] = []
    campo = _armar(raiz, raiz / "datos", pedidos)
    return raiz, campo, pedidos


def test_el_campo_valida_contra_el_schema_y_sus_rutas_existen(
    corrida: tuple[Path, Campo, list[str]],
) -> None:
    raiz, campo, _ = corrida
    datos = raiz / "datos"
    documento = json.loads((datos / "campos" / campo.id / "campo.json").read_text("utf-8"))
    validador = Draft202012Validator(
        json.loads(ESQUEMA.read_text("utf-8")), format_checker=Draft202012Validator.FORMAT_CHECKER
    )

    assert [e.message for e in validador.iter_errors(documento)] == []
    rutas = (
        [campo.referencia, campo.rastro]
        + [e.imagen for e in campo.epocas]
        + [e.diferencia for e in campo.epocas]
    )
    for ruta in rutas:
        assert ruta is not None
        assert (datos / ruta).is_file()


def test_el_cuerpo_queda_marcado_y_medido_en_cada_epoca(
    corrida: tuple[Path, Campo, list[str]],
) -> None:
    _, campo, _ = corrida
    cuerpo = campo.conocidos[0]

    assert cuerpo.nombre == "Cuerpo"
    assert cuerpo.fuente == "Horizons"
    assert [p.distancia_ua for p in cuerpo.posiciones] == [50.123] * 4
    assert all(p.dentro_del_campo for p in cuerpo.posiciones)
    assert len(cuerpo.deteccion) == 4
    assert all(d.snr >= 5 and d.distancia_px < 1 for d in cuerpo.deteccion)
    primera, ultima = cuerpo.posiciones[0], cuerpo.posiciones[-1]
    assert math.hypot(ultima.x - primera.x, ultima.y - primera.y) >= 2


def test_las_estrellas_fijas_controlan_la_alineacion(
    corrida: tuple[Path, Campo, list[str]],
) -> None:
    _, campo, _ = corrida
    control = [c for c in campo.conocidos if c.fuente == "Gaia DR3"]

    assert len(control) == 3
    for estrella in control:
        assert len(estrella.deteccion) == 4
        assert all(d.distancia_px < 1 for d in estrella.deteccion)


def test_la_geometria_tiene_la_tierra_y_el_cuerpo_en_cada_epoca(
    corrida: tuple[Path, Campo, list[str]],
) -> None:
    _, campo, _ = corrida

    assert campo.geometria is not None
    ids = [e.id for e in campo.epocas]
    assert [p.epoca_id for p in campo.geometria.tierra] == ids
    assert [p.epoca_id for p in campo.geometria.objeto.posiciones] == ids
    assert campo.geometria.tierra[0].x_ua == 1.0
    assert campo.geometria.objeto.posiciones[0].x_ua == 40.0


def test_con_la_cache_llena_no_sale_a_la_red_y_da_los_mismos_archivos(
    corrida: tuple[Path, Campo, list[str]],
) -> None:
    raiz, campo, _ = corrida
    pedidos: list[str] = []

    otra = _armar(raiz, raiz / "otra", pedidos)

    assert pedidos == []
    assert otra == campo
    primera = raiz / "datos" / "campos" / campo.id
    segunda = raiz / "otra" / "campos" / campo.id
    nombres = sorted(p.name for p in primera.iterdir())
    assert nombres == sorted(p.name for p in segunda.iterdir())
    for nombre in nombres:
        assert (primera / nombre).read_bytes() == (segunda / nombre).read_bytes(), nombre


def test_nunca_pide_mas_que_los_servicios_previstos(
    corrida: tuple[Path, Campo, list[str]],
) -> None:
    _, _, pedidos = corrida

    hosts = {httpx2.URL(p).host for p in pedidos}
    assert hosts <= {"irsa.prueba", "horizons.prueba"}
