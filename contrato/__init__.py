"""Contrato de datos de spherex-blink.

Única fuente de verdad de la forma de los datos: de estos modelos salen el
JSON Schema (con el que se validan los archivos del pipeline) y los tipos TS
(con los que compila la web).
"""

VERSION_CONTRATO = "0.3.0"
"""Sube la minor al agregar campos opcionales y la mayor al romper la forma."""
