"""Configuración centralizada y segura de logging para la aplicación."""

import logging
import os


class EmojiLogFormatter(logging.Formatter):
    """Añade un emoji por nivel para facilitar la lectura en terminal."""

    LEVEL_EMOJI = {
        logging.DEBUG: "🔎",
        logging.INFO: "✅",
        logging.WARNING: "⚠️",
        logging.ERROR: "❌",
        logging.CRITICAL: "🚨",
    }

    def format(self, record: logging.LogRecord) -> str:
        record.level_emoji = self.LEVEL_EMOJI.get(record.levelno, "📝")
        return super().format(record)


def get_log_level(value: str | None = None) -> int:
    """Convierte ``LOG_LEVEL`` a un nivel válido; INFO es el fallback seguro."""
    configured_value = value if value is not None else os.getenv("LOG_LEVEL", "INFO")
    normalized_value = configured_value.upper().strip()
    level = logging.getLevelName(normalized_value)
    return level if isinstance(level, int) else logging.INFO


def setup_logging() -> None:
    """Configura una sola vez los logs de la aplicación y sus dependencias relevantes."""
    level = get_log_level()
    formatter = EmojiLogFormatter(
        "%(asctime)s - %(name)s - %(levelname)s %(level_emoji)s - %(message)s"
    )
    root_logger = logging.getLogger()
    configured_handlers = [
        handler for handler in root_logger.handlers if getattr(handler, "_docdai_logging", False)
    ]

    if configured_handlers:
        for handler in configured_handlers:
            handler.setLevel(level)
            handler.setFormatter(formatter)
    elif root_logger.handlers:
        for handler in root_logger.handlers:
            handler.setLevel(level)
            handler.setFormatter(formatter)
            handler._docdai_logging = True  # type: ignore[attr-defined]
    else:
        handler = logging.StreamHandler()
        handler.setLevel(level)
        handler.setFormatter(formatter)
        handler._docdai_logging = True  # type: ignore[attr-defined]
        root_logger.addHandler(handler)

    root_logger.setLevel(level)
    external_level = logging.DEBUG if level == logging.DEBUG else logging.ERROR
    for logger_name in ("ppocr", "paddlex", "paddle"):
        logging.getLogger(logger_name).setLevel(external_level)
