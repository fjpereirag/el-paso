# El paso · De Egipto a la Tierra Prometida

Itinerario de fe en dos partes y diecisiete etapas sobre un mapa 3D en relieve, estilo atlas: el Éxodo de Israel y su cumplimiento en Cristo.

| Etapa | Lugar | Tema |
|---|---|---|
| I | Egipto · Ramsés | La esclavitud y la buena noticia (kerigma) |
| II | El mar Rojo | El paso por el mar — *momento firma: el mar se abre al bajar* |
| III | Mara | El sufrimiento y la cruz: el madero que endulza el agua |
| IV | Desierto de Sin | El maná de cada día (Eucaristía) |
| V | Refidim | La prueba del desierto: el agua de la roca |
| VI | Monte Sinaí | La Alianza y la conversión: de esclavo a hijo |
| VII | Camino de Edom | La serpiente de bronce: mirar al crucificado |
| VIII | Monte Nebo | La madurez de la fe y la muerte sin miedo |
| IX | Jericó | La comunidad y la Iglesia |

**Segunda parte · El paso continúa (el nuevo Éxodo)**

| Etapa | Lugar | Tema |
|---|---|---|
| X | El Jordán · Betania | El Bautismo |
| XI | Desierto de Judea | Las tentaciones |
| XII | Monte Tabor | La Transfiguración («su éxodo») |
| XIII | Jerusalén · Cenáculo | La nueva Pascua |
| XIV | Jerusalén · Gólgota | La cruz |
| XV | Jerusalén · Sepulcro | La Resurrección |
| XVI | Emaús | Palabra y pan |
| XVII | Jerusalén · Pentecostés | El Espíritu y la misión |

Cada etapa de la segunda parte enlaza con las del Éxodo que cumple. Cierre: «Hasta los confines de la tierra» (Hch 1, 8; 1 Pe 3, 15).

Cada etapa: número romano, texto, cita bíblica (CEE) con eco del Nuevo Testamento, pregunta para la oración, enlace a la lectura y botón de WhatsApp (enlaza a `#etapa-N`).

## Publicar en GitHub Pages
1. Crea el repositorio `el-paso` y sube todo el contenido de esta carpeta a la raíz.
2. *Settings → Pages → Deploy from a branch → main / (root)*.
3. Quedará en `https://<usuario>.github.io/el-paso/`.

## Técnica
- HTML + CSS + JS sin compilación. Three.js r160 incluido en `js/` (no depende de CDN ni de claves de pago).
- Mapa generado por código (relieve, mares, Nilo, Jordán) y ruta compartida entre el 3D y el mapa SVG.
- Sin WebGL se muestra el mapa SVG estático. Respeta `prefers-reduced-motion`.
- Variante pastoral de la especificación Awwwards: «noche, oro y silencio».

