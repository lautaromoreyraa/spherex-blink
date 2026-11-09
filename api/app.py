"""Arranque de la API.

Se levanta con `uvicorn api.app:app`.
"""

from fastapi import FastAPI

from api.rutas import salud
from core.version import version_de_la_aplicacion


def crear_app() -> FastAPI:
    """Arma la aplicación; una función y no un global para poder testearla limpia."""
    app = FastAPI(title="spherex-blink", version=version_de_la_aplicacion())
    app.include_router(salud.router)
    return app


app = crear_app()
