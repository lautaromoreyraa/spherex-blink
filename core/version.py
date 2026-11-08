"""Versión de la aplicación."""

from importlib.metadata import PackageNotFoundError, version


def version_de_la_aplicacion() -> str:
    """Versión instalada del paquete, la misma que declara `pyproject.toml`.

    Se lee de los metadatos en vez de repetirla en el código para que haya un
    único lugar donde subirla.
    """
    try:
        return version("spherex-blink")
    except PackageNotFoundError:
        # Corriendo desde el árbol sin instalar (no debería pasar con
        # `pip install -e .`, pero no es motivo para que /salud falle).
        return "0.0.0+sin-instalar"
