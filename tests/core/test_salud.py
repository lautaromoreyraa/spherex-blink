from importlib.metadata import version

from core.salud import estado_del_servicio


def test_el_servicio_responde_ok_con_la_version_instalada() -> None:
    salud = estado_del_servicio()

    assert salud.estado == "ok"
    assert salud.version == version("spherex-blink")
