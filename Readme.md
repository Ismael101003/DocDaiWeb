# DocDaiWeb 🏥📄

**DocDaiWeb** es una plataforma web inteligente diseñada para transformar documentos médicos físicos y digitales (recetas, estudios clínicos en PDF, imágenes) en historiales clínicos estructurados. Mediante el uso de tecnologías de Reconocimiento Óptico de Caracteres (OCR) e Inteligencia Artificial, la plataforma genera perfiles dinámicos de pacientes con seguimiento automatizado y análisis de riesgos, eliminando la necesidad de captura manual [1, 2].

## 🚀 Características Principales

*   **Digitalización Automatizada:** Procesamiento de expedientes históricos y documentos no estructurados utilizando **PaddleOCR** de alta precisión [2, 3].
*   **Orquestación Multiagente:** Uso de **LangGraph** para modelar el pipeline de extracción médica (Carga -> OCR -> NLP -> Estructuración) como una máquina de estados [4].
*   **Validación Human-in-the-Loop (HITL):** El flujo puede pausarse ante lecturas de OCR dudosas, permitiendo la intervención y validación del médico antes de guardar el expediente [5].
*   **Cumplimiento Normativo y Privacidad:** Arquitectura diseñada para cumplir con la NOM-004-SSA3-2012 (expediente clínico), NOM-024-SSA3-2012 y la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) mediante procesamiento de datos seguro [6].
*   **Seguimiento Terapéutico:** Generación de calendarios de medicación y monitoreo de adherencia del paciente [7].

## 🛠️ Stack Tecnológico

El proyecto está construido bajo un enfoque de **Monorepo** utilizando **Clean Architecture** (Arquitectura Limpia) para separar estrictamente las reglas de negocio de la infraestructura de IA [8, 9].

*   **Frontend:** React + Bootstrap (SPA ligera y de carga rápida) [3, 5].
*   **Backend:** FastAPI (Rendimiento asíncrono nativo óptimo para concurrencia de archivos pesados) [3, 5].
*   **Base de Datos:** PostgreSQL (Integridad transaccional ACID y soporte JSONB para perfiles dinámicos) [5].
*   **Inteligencia Artificial:** PaddleOCR (Extracción visual), LangGraph (Orquestación de flujos de trabajo) [5].

