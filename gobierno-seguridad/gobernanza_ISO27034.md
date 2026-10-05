# Gobernanza de Seguridad (ISO/IEC 27034)
**Proyecto:** SmartCity — CityPark API (Caso 8)

## 1. Marco Normativo Organizacional (ONF - Organizational Normative Framework)
El proyecto CityPark adopta un enfoque DevSecOps basado en la norma ISO/IEC 27034. Las políticas organizacionales exigen que todo desarrollo de software municipal cumpla con:
*   **Principio Zero Trust:** Ninguna entrada de datos, interna o externa, es confiable por defecto.
*   **Auditoría Continua:** Se prohíbe el paso a producción de sistemas con vulnerabilidades listadas en el OWASP Top 10.
*   **Protección de Datos:** Toda PII (Información de Identificación Personal) como patentes y nombres debe ser tratada bajo confidencialidad y cifrado.

## 2. Diseño y Requerimientos de Seguridad (ASR - Application Security Requirements)
Para blindar la plataforma CityPark, se establecen los siguientes requerimientos desde la arquitectura:
*   **ASR-01 (Autenticación):** Toda acción administrativa requiere un token criptográfico con tiempo de expiración corto.
*   **ASR-02 (Autorización):** Implementación de Control de Acceso Basado en Roles (RBAC) estricto para diferenciar a ciudadanos de inspectores.
*   **ASR-03 (Validación):** Todas las entradas deben ser validadas en el backend usando expresiones regulares (Regex) y listas blancas para tipos de datos (ej. montos mayores a 0).
*   **ASR-04 (Trazabilidad):** Toda anulación de multas debe generar un registro forense inmutable.

## 3. Perfil de Controles de Seguridad (ASC - Application Security Controls)
Mapeo de los controles técnicos aplicados en el código refactorizado para mitigar el OWASP Top 10:
*   **ASC-01 (Mitiga A01 - Broken Access Control):** Middleware `verifyInspector` implementado para validar roles en endpoints críticos (PUT `/api/multas/anular/:id`).
*   **ASC-02 (Mitiga A02 - Cryptographic Failures):** Uso del algoritmo `bcrypt` con factor de trabajo para ofuscar contraseñas y cifrado de datos en tránsito vía TLS/SSL.
*   **ASC-03 (Mitiga A03 - Injection):** Implementación exclusiva de consultas SQL parametrizadas (`?`) en SQLite.
*   **ASC-04 (Mitiga A04 - Insecure Design):** Lógica de negocio defensiva que bloquea montos negativos (`amount < 0`).
*   **ASC-05 (Mitiga A05 - Security Misconfiguration):** Uso de la librería `helmet` para neutralizar cabeceras inseguras y restricción estricta de archivos dotfiles (`.env`).
*   **ASC-06 (Mitiga A08 - Software and Data Integrity):** Sanitización de inputs contra XSS reemplazando caracteres de escape HTML (`<`, `>`).
*   **ASC-07 (Mitiga A09 - Security Logging):** Creación de la tabla `audit_logs` que captura `user_id`, `action` y `timestamp` de cada evento crítico.
*   **ASC-08 (Mitiga A10 - SSRF):** Validación de URLs entrantes mediante una lista blanca de dominios permitidos para mapas (`https://api.mapas-oficial.cl`).