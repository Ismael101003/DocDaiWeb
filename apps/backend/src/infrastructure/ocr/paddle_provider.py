"""Adaptador PaddleOCR para imágenes ya preparadas por el pipeline documental."""

from collections.abc import Mapping, Sequence
import json
import logging
from pathlib import Path
from typing import Any

from paddleocr import PaddleOCR

from src.domain.interfaces.ocr_provider import OcrBlock, OcrEngineError, OcrPageResult

logger = logging.getLogger(__name__)


class PaddleOcrProvider:
    """Implementa OCR local con PaddleOCR sin depender de FastAPI."""

    def __init__(self, *, language: str = "es") -> None:
        self._language = language
        self._engine: PaddleOCR | None = None

    def extract(self, *, images: Sequence[Path]) -> list[OcrPageResult]:
        """Ejecuta PaddleOCR para cada imagen y devuelve texto y confianza por página."""
        engine = self._get_engine()
        page_results: list[OcrPageResult] = []

        for page_number, image_path in enumerate(images, start=1):
            try:
                logger.debug("Procesando página OCR", extra={"page": page_number})
                raw_results = engine.predict(str(image_path))
                text, confidences, blocks = self._parse_result(list(raw_results))
            except OcrEngineError:
                raise
            except Exception as exc:
                logger.exception("Error al procesar página OCR", extra={"page": page_number})
                raise OcrEngineError("PaddleOCR no pudo procesar una imagen preparada.") from exc

            page_results.append(
                OcrPageResult(text=text, confidences=tuple(confidences), blocks=tuple(blocks))
            )
            logger.debug(
                "Página OCR procesada",
                extra={"page": page_number, "detected_lines": len(confidences)},
            )

        return page_results

    def _get_engine(self) -> PaddleOCR:
        """Inicializa el motor de forma diferida para no cargar modelos al arrancar la API."""
        if self._engine is not None:
            return self._engine

        try:
            logger.debug("Inicializando proveedor PaddleOCR", extra={"language": self._language})
            self._engine = PaddleOCR(
                lang=self._language,
                use_doc_orientation_classify=False,
                use_doc_unwarping=False,
                use_textline_orientation=False,
            )
        except Exception as exc:
            logger.exception("Error al inicializar proveedor PaddleOCR")
            raise OcrEngineError("No fue posible inicializar PaddleOCR.") from exc

        logger.info("Modelo PaddleOCR disponible", extra={"language": self._language})
        return self._engine

    def _parse_result(self, results: list[Any]) -> tuple[str, list[float], list[OcrBlock]]:
        """Extrae texto y puntuaciones de formatos de resultado PaddleOCR 2.x y 3.x."""
        lines: list[tuple[str, float]] = []

        for result in results:
            self._collect_lines(self._to_mapping(result), lines)

        blocks = [OcrBlock(text=text, confidence=score) for text, score in lines]
        return "\n".join(text for text, _ in lines), [score for _, score in lines], blocks

    def _to_mapping(self, value: Any) -> Any:
        """Convierte resultados serializables de PaddleOCR a estructuras estándar."""
        if hasattr(value, "json"):
            raw_value = value.json
            raw_value = raw_value() if callable(raw_value) else raw_value
            return json.loads(raw_value) if isinstance(raw_value, str) else raw_value

        return value

    def _collect_lines(self, value: Any, lines: list[tuple[str, float]]) -> None:
        """Recorre rec_texts/rec_scores y el formato legado de pares texto-confianza."""
        if isinstance(value, Mapping):
            texts = value.get("rec_texts")
            scores = value.get("rec_scores")

            if isinstance(texts, list) and isinstance(scores, list):
                lines.extend(
                    (str(text), float(score))
                    for text, score in zip(texts, scores, strict=False)
                )

            for nested_value in value.values():
                self._collect_lines(nested_value, lines)
            return

        if isinstance(value, (list, tuple)):
            if len(value) == 2 and isinstance(value[1], (list, tuple)):
                candidate = value[1]
                if len(candidate) == 2 and isinstance(candidate[0], str):
                    lines.append((candidate[0], float(candidate[1])))
                    return

            for nested_value in value:
                self._collect_lines(nested_value, lines)
