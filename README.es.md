# Jarvis v7

**🇧🇷 [Português](README.md) · 🇺🇸 [English](README.en.md) · 🇪🇸 [Español](README.es.md)**

**[Guía pública de uso](https://inematds.github.io/jarvisv7/guia/es/)** · [Versiones](https://github.com/inematds/jarvisv7/releases)

Asistente personal local y base de referencia para crear tu propio Jarvis. Interfaz en portugués, conocimiento persistente y elección de cerebro para cada conversación: **Codex OAuth, Claude OAuth u OpenRouter API**. Imágenes y videos a través de **Kie**.

Esta entrega es la versión **0.2.0**. El [estado de implementación](docs/estado-da-implementacao.md) distingue lo que funciona de lo que aún está en el plan. El nombre del proyecto sigue siendo Jarvis v7; 0.1.0 es la versión del software.

## Novedad: JEV Reflex — cinco decisiones antes de la respuesta

El **JEV real** guía el chat antes de que intervenga el cerebro principal: destino de la solicitud,
completitud, orientación al asistente, necesidad de actuar y cobertura de las notas.
Activa **Configuración → Preferencias → JEV · enrutamiento Reflex** usando tu conexión
de OpenRouter. El panel Reflex muestra el modelo, las probabilidades, la latencia y el costo reportado.
Hay consumo de API; si falla, el chat continúa con un fallback local identificado explícitamente.

[Cómo funciona y cuáles son sus límites](docs/jev-reflex.md) ·
[Jarvis Modelo: base reutilizable con JEV](https://inematds.github.io/jarvismodelo/guia/)

## Instalar y abrir

Requiere **Node.js 24** y npm. Para archivos PDF con texto, instala `pdftotext` (en Ubuntu/Debian: paquete `poppler-utils`). Codex y Claude son opcionales; instala los runtimes oficiales para usar esas cuentas.

```bash
git clone https://github.com/inematds/jarvisv7.git
cd jarvisv7
npm ci
npm run preflight
npm start
```

Abre **http://127.0.0.1:4700**. Elige un perfil la primera vez; las notas de ejemplo son ficticias y opcionales. El servidor solo escucha en esta máquina. Para usarlo desde un celular, necesitas instalarlo allí o acceder a la máquina de forma remota; la interfaz adaptable no expone la aplicación en la red.

No hace falta configurar un servicio para explorar las notas y la búsqueda local, que devuelve fragmentos y no genera respuestas con IA.

## Elegir el cerebro y los módulos

1. En **Configuración → Conexiones**, conecta los servicios que quieras.
2. **Codex:** usa la cuenta de ChatGPT del runtime oficial. Se reconoce un inicio de sesión existente; el botón Conectar inicia el flujo en el navegador.
3. **Claude:** ejecuta `claude auth login` en la terminal. Habilita la integración personal en Cerebro; consulta las [condiciones y los límites de autenticación](docs/provedores-e-autenticacao.md).
4. **OpenRouter / Kie:** pega tu propia credencial en el campo local del servicio. Los tokens OAuth de las CLI no se leen ni se reutilizan como claves de API.
5. En **Cerebro**, selecciona el proveedor, el modelo y el nivel de esfuerzo. El catálogo de Codex proviene de la instalación o la cuenta; el de OpenRouter, del servicio. Claude usa los alias oficiales del runtime.
6. En el campo de conversación, haz clic en el proveedor para cambiar el cerebro de esa conversación y conservar el historial. El siguiente proveedor recibirá el historial limitado y las notas seleccionadas.
7. En **Preferencias**, habilita voz, compartir pantalla, contenido multimedia y enfoque; ajusta la personalidad y el límite diario de solicitudes de contenido multimedia.

Un mayor nivel de esfuerzo puede consumir más tiempo y cuota. Usa `medium` para el uso cotidiano y auméntalo cuando la tarea lo requiera. Los valores disponibles dependen del modelo.

## Usar

- Importa archivos Markdown, TXT y PDF con texto en **Conocimiento**; edita y elimina documentos desde la propia interfaz.
- Escribe **“Lembre que…”** para guardar un recuerdo real. Revísalo en **Memorias**.
- Haz preguntas sobre los documentos. Las fuentes abren el fragmento preservado en el momento de la respuesta y también permiten abrir el documento actual.
- Consulta el **Historial** de la conversación, incluso en pantallas pequeñas.
- El mapa conecta referencias por título y `[[links]]`; no infiere relaciones semánticas.
- Comparte la pantalla explícitamente y envía un fotograma junto con la pregunta a un modelo con visión. No hay observación continua ni control del computador.
- El micrófono usa el reconocimiento del navegador cuando está disponible, que puede depender de un servicio remoto. La voz depende de las voces del navegador. No es un modo de voz que permanezca activo continuamente.
- En el **Estudio**, elige imagen o video, confirma el consumo del proveedor y sigue el proceso. Los archivos generados se descargan en tu biblioteca. Esta interfaz no permite cancelar las solicitudes enviadas a Kie.
- **Enfoque** es un temporizador manual persistente, con pausa y registro de distracciones.

## Datos, copia de seguridad y actualización

La base de datos SQLite, la biblioteca y las credenciales locales se guardan en `data/`, fuera de Git. `JARVIS_DATA_DIR` permite usar otra ubicación. Es preferible una ruta absoluta. La exportación JSON no contiene credenciales e incluye notas, recuerdos, configuración e historial; la importación desde la interfaz solo añade notas y recuerdos.

La instantánea de la interfaz copia la base de datos mientras el servidor está activo. Para hacer una copia de seguridad de la base de datos **y el contenido multimedia**, detén el servidor y ejecuta:

```bash
npm run backup -- --stopped
```

El comando indica la carpeta creada y las instrucciones para restaurarla. Las credenciales quedan fuera de esta copia de seguridad; vuelve a conectarlas después de restaurar. Para copiar credenciales manualmente, conserva los permisos y protege también la clave de cifrado local.

Para una instalación clonada desde un repositorio con versiones publicadas, configura `JARVIS_RELEASE_REPO=inematds/jarvisv7` para consultar las versiones desde la interfaz. Para instalar una etiqueta publicada, con el servidor detenido y Git sin cambios:

```bash
npm run update -- v0.1.1 --stopped
```

`v0.1.1` es un ejemplo, no una versión publicada. El comando hace una copia de seguridad, obtiene la etiqueta de tu `origin`, instala las dependencias y ejecuta las pruebas y la compilación. No reinicia el servidor. Si falla, indica la revisión anterior; la restauración de la base de datos debe respetar el esquema. Las personalizaciones de comportamiento se guardan en la configuración; los cambios en el código deben quedar en tu rama e integrarse de forma consciente. No hay actualizaciones automáticas en segundo plano.

El archivo `.env.example` documenta opciones; no se carga automáticamente. Exporta las variables en el shell o usa el mecanismo de tu administrador de procesos.

## Desarrollo y contribuciones

```bash
npm run dev       # servidor, porta 4700
npm run dev:web   # segundo terminal, interfaz em 5173
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

- `apps/server`: API local, almacenamiento, cola y adaptadores.
- `apps/web`: aplicación React, estilos y componentes.
- `packages/shared`: tipos y preferencias predeterminadas.
- `scripts`: diagnóstico, copia de seguridad y actualización.
- `tests`: reglas de persistencia, API, cola y navegador.
- `docs`: análisis de los materiales, arquitectura, decisiones y hoja de ruta.
- [Guía de extensiones](docs/como-estender.md): cómo añadir un cerebro o un proveedor de contenido multimedia.

Nunca incluyas `data/`, archivos `.env` ni tokens en una contribución. Los materiales de terceros recibidos en `docs/` son referencias locales y están excluidos de la distribución; este proyecto no presupone que exista autorización para republicarlos.

## Licencia

Código propio bajo [MIT](LICENSE). La licencia no cubre los PDF, las transcripciones ni los paquetes de prompts de terceros usados como referencia, ni reemplaza las licencias de las dependencias.

## Solución de problemas

| Situación | Qué hacer |
|---|---|
| `npm`/Node incompatible | Instala Node 24, ejecuta `npm ci` y `npm run doctor`. |
| Puerto ocupado | Cierra la instancia anterior o ejecuta `PORT=4703 npm start`. Abre el mismo puerto en el navegador. |
| Codex/Claude no disponible | Instala la CLI oficial del proveedor y comprueba `codex --version` o `claude --version`. Inicia sesión en tu cuenta. |
| Modelo no disponible | Actualiza el runtime y vuelve a elegir un modelo del catálogo; la disponibilidad depende de la cuenta. |
| Claude no responde | Comprueba `claude auth status`, la habilitación de la integración y los límites de la cuenta. |
| OpenRouter/Kie devuelve un error | Comprueba la credencial, el saldo, el modelo y los detalles en Trabajos. Tener una credencial guardada no confirma que haya saldo. |
| Envío de contenido multimedia incierto | Comprueba el historial de Kie antes de crear otra solicitud; es posible que la anterior ya se haya cobrado. |
| PDF sin texto | Ejecuta OCR externamente o usa un PDF con texto; la importación no hace OCR. |
| Mapa sin conexiones | Incluye `[[Título exacto]]` de otro documento en una nota; la lista accesible seguirá disponible. |
| Voz o pantalla no disponible | Comprueba los permisos y la compatibilidad del navegador; usa texto cuando la función no esté disponible. |
| Interfaz antigua después de compilar | Reinicia el servidor de producción y vuelve a cargar la página. |

Para restaurar una copia de seguridad completa, detén el servidor, elige una carpeta de datos **vacía**, copia `jarvis.sqlite` y `assets/` de la copia de seguridad en ella e inicia con `JARVIS_DATA_DIR=/caminho/da/pasta npm start`. Vuelve a conectar las credenciales. Usa una versión del software compatible con el esquema de la copia de seguridad. Conserva la carpeta anterior hasta verificar la restauración.

## Documentación completa

El README es el punto de entrada para la instalación y el funcionamiento. Los detalles técnicos están en los documentos siguientes; las funciones futuras están identificadas como planificación.

| Documento | Contenido |
|---|---|
| [Estado de implementación](docs/estado-da-implementacao.md) | Funciones entregadas, limitaciones y lo que aún falta en la versión 0.1.0 |
| [Autenticación y proveedores](docs/provedores-e-autenticacao.md) | OAuth, APIs, condiciones de integración y referencias oficiales |
| [Cómo extender](docs/como-estender.md) | Añadir un cerebro, un proveedor de contenido multimedia o crear tu propia versión |
| [Configuración y actualizaciones](docs/configuracao-e-atualizacoes.md) | Visión planificada de perfiles, configuración y evolución; consulta el estado para conocer la compatibilidad actual |
| [Arquitectura y contratos](docs/arquitetura-e-contratos.md) | Contratos y arquitectura de referencia del plan completo |
| [Plan maestro](docs/plano-mestre-jarvis-v7.md) | Objetivo, alcance y decisiones del proyecto |
| [Hoja de ruta y criterios](docs/roadmap-e-criterios.md) | Fases futuras y criterios de aceptación |
| [Análisis consolidado](docs/analise-consolidada.md) | Síntesis de los materiales que orientaron la base |
| [Validación 0.1.0](docs/validacao-0.1.0.md) | Pruebas ejecutadas, integración OAuth real, límites y revisión visual |
| [Producto](PRODUCT.md) y [diseño](DESIGN.md) | Propósito del producto y patrones de la interfaz desarrollada |
| [Registro de cambios](CHANGELOG.md) | Historial de versiones |
| [Índice de docs](docs/README.md) | Documentos complementarios e inventario histórico |

Los PDF y los paquetes de prompts originales se recibieron para análisis local y no se incluyen en el clon público. Su ausencia no impide instalar, probar ni adaptar la aplicación.
