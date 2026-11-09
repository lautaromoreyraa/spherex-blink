"""Pasadas, visitas y elección de épocas."""

from core.epocas import Observacion, agrupar_en_visitas, elegir_epocas, pasada_de

MINUTO = 1 / 1440


def _obs(mjd: float) -> Observacion:
    return Observacion(
        planeid=f"p{mjd}",
        uri=f"https://irsa/{mjd}.fits",
        mjd=mjd,
        detector="D1",
        version_proceso="1",
    )


def test_la_pasada_sale_de_la_fecha() -> None:
    assert pasada_de(60834.4) == 1  # 2025-06
    assert pasada_de(61038.1) == 2  # 2025-12
    assert pasada_de(61200.4) == 3  # 2026-06
    assert pasada_de(60000.0) == 1
    assert pasada_de(70000.0) == 4


def test_exposiciones_a_minutos_son_una_visita() -> None:
    observaciones = [_obs(61200.0 + i * 2 * MINUTO) for i in range(4)] + [_obs(61200.5)]

    visitas = agrupar_en_visitas(observaciones)

    assert [len(v) for v in visitas] == [4, 1]


def test_elige_una_por_visita_repartidas_en_la_pasada() -> None:
    visitas = [61200.0 + 0.5 * i for i in range(9)]
    observaciones = [_obs(m + k * 2 * MINUTO) for m in visitas for k in range(3)]

    elegidas = elegir_epocas(observaciones, maximo_por_pasada=3)

    assert [o.mjd for o in elegidas] == [61200.0, 61202.0, 61204.0]


def test_el_id_de_epoca_es_kebab_con_pasada_y_hora() -> None:
    assert _obs(61200.405730278).id_de_epoca == "p3-20260609-094415"
