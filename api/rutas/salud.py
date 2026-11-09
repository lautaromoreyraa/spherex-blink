"""Ruta de salud: la usa Railway para saber si la API despertó."""

from fastapi import APIRouter

from contrato.api import Salud
from core.salud import estado_del_servicio

router = APIRouter(tags=["salud"])


@router.get("/salud", response_model=Salud)
def salud() -> Salud:
    return estado_del_servicio()
