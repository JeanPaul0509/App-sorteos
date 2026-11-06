---
version: 1.0
name: GoldenTicket
description: Sistema de diseño de GoldenTicket, app de sorteos con pago por Yape. Noche esmeralda como fondo, oro como protagonista y boletos de papel marfil. Debe transmitir lujo sobrio y, sobre todo, confianza para pagar. Tipografía Archivo con ancho expandido en títulos, cifras tabulares, bolitas de colores para el estado de cada número y movimiento firme y corto.

colors:
  # Marca
  gold: "#e2b43c"            # protagonista: logo, acentos, barra de progreso, anillo de selección
  gold-deep: "#a8801f"       # oro sobre fondos claros cuando se necesita contraste
  gold-soft: "#f6ecd0"       # fondo de imágenes vacías y rellenos suaves
  brand: "#0b3326"           # esmeralda: barra superior, bloque de pasos, botón principal, pager
  brand-deep: "#072219"      # hover del botón principal
  night: "#061a13"           # fondo de página
  # Superficies
  ivory: "#fffdf6"           # boletos, tarjetas, modales (papel marfil, nunca blanco puro)
  paper: "#eef3ee"           # pista de barras de progreso, rellenos dentro de tarjetas
  line: "#dde6df"            # bordes finos y línea perforada del boleto
  # Texto
  ink: "#0f2a20"             # texto sobre marfil
  text-on-dark: "#eef4ef"    # texto sobre la noche
  text-on-dark-muted: "rgb(255 255 255 / 0.60)"
  link: "#0b5d43"            # enlaces sobre marfil
  # Estado de los números (no cambiar: es el lenguaje de la app)
  ball-available: "#16a34a"  # verde: disponible
  ball-reserved: "#f5c518"   # amarillo: reservado, esperando pago
  ball-reserved-text: "#5c4300"
  ball-sold: "#d6d9e0"       # gris: vendido / pagado
  ball-sold-text: "#6b7280"
  # Acciones especiales
  pay-gradient: "linear-gradient(180deg, #f0cb66, #e2b43c)"  # SOLO para "Ir a pagar"
  whatsapp: "#15803d"
  danger-bg: "#fee2e2"
  danger-text: "#b91c1c"
  ruby: "#b3262d"            # avisos destructivos puntuales

typography:
  family: "Archivo (Google Fonts, eje de ancho 100–125)"
  brand:
    fontSize: 20px            # 30px en login
    fontWeight: 800
    fontStretch: 112%
    letterSpacing: -0.02em
  hero:
    fontSize: 36px            # 30px en celular
    fontWeight: 800
    fontStretch: 110%
    lineHeight: 1.15
  page-title:
    fontSize: 24px
    fontWeight: 800
  card-title:
    fontSize: 18px
    fontWeight: 800
    lineHeight: 1.375
    maxLines: 3
  price:
    fontSize: 24px
    fontWeight: 800
    letterSpacing: -0.025em
  body:
    fontSize: 16px
    fontWeight: 400
  small:
    fontSize: 14px
  caption:
    fontSize: 12px
  ball:
    fontSize: 12.8px
    fontWeight: 700
  numerals: tabular          # font-feature-settings: "tnum" en todo el body

rounded:
  ball: 9999px
  button: 12.8px             # 0.8rem
  input: 12.8px
  card: 16px
  ticket: 17.6px             # 1.1rem, con muescas
  image-in-card: 12px
  modal: 16px

spacing:
  page-gutter: 16px
  page-max-width: 1024px     # max-w-5xl
  section-gap: 40px
  card-padding: 20px
  ticket-stub-height: 84px   # 5.25rem, fijo para que las muescas calcen
  grid-gap: 20px
  ball-min: 46px             # 2.9rem
  ball-gap: 8px

motion:
  ease-out: "cubic-bezier(0.23, 1, 0.32, 1)"
  ease-in-out: "cubic-bezier(0.77, 0, 0.175, 1)"
  ease-drawer: "cubic-bezier(0.32, 0.72, 0, 1)"
  press: "scale(0.97) · 160ms ease-out"
  ball-press: "scale(0.92) · 160ms ease-out"
  modal-in: "translateY(12px) scale(0.97) + opacity · 240ms ease-out"
  sheet-in: "translateY(100%) · 320ms ease-drawer"
  toast-in: "translateY(-8px) scale(0.97) + opacity · 200ms ease-out"
  rise: "translateY(10px) + opacity · 360ms ease-out · stagger 50ms (máx. 6)"
  hero-ticket: "rotateX(40deg) rotate(-10deg) → rotate(-4deg) · 900ms + brillo 1100ms, una sola vez"
  auth-ticket: "translateY(20px) rotateX(16deg) scale(0.97) + opacity · 700ms ease-out + brillo dorado suave 1000ms, una vez al abrir login/registro"

components:
  ticket: "Tarjeta de sorteo con forma de boleto: marfil, muescas laterales a la altura de la línea perforada, talón fijo abajo con precio, % vendido y personas"
  ball: "Bolita circular de número: verde / amarillo / gris; elegida = esmeralda con anillo dorado"
  button-primary: "Esmeralda con texto dorado"
  button-pay: "Degradado dorado, texto tinta. Único botón brillante de la app"
  button-light: "Marfil con borde fino"
  pager: "‹ N › con N en píldora esmeralda y texto dorado; de 100 en 100"
  bottom-sheet: "Barra fija abajo, blanca 95% con desenfoque, sube con ease-drawer"
  modal: "Centrado, marfil, cierra con Esc y tocando fuera"
  brand-mark: "Boleto dorado pequeño con muescas + 'Golden' + 'Ticket' en oro"
---

# GoldenTicket: sistema de diseño

> Lee este archivo antes de cambiar cualquier pantalla. Si un cambio no encaja aquí, primero se actualiza este archivo y después el código.

## Overview

GoldenTicket vende números para sorteos y cobra por Yape. La gente paga **antes** de ver el premio, así que el diseño tiene una sola misión: **que se vea confiable sin dejar de ser emocionante**.

La idea visual es **un boleto dorado sobre una mesa de casino de noche**:

- **Noche esmeralda:** el fondo, casi negro con verde profundo, como el paño de una mesa de juego.
- **Oro:** el color de la suerte. Es el protagonista, pero se usa en dosis pequeñas.
- **Papel marfil:** cada sorteo es un boleto físico, con muescas y línea perforada.

Lujo sobrio, no casino de luces. Nada parpadea y nada compite con el premio.

## Colors

### Marca y acento
- **Oro `#e2b43c`**: logo, número de los pasos, barra de progreso, anillo de la bolita elegida, links sobre fondo oscuro.
- **Esmeralda `#0b3326`**: barra superior, bloque de pasos del inicio, botón principal, selector de página.
- **Noche `#061a13`**: fondo de todas las páginas, con dos brillos suaves (oro arriba a la derecha, esmeralda abajo a la izquierda).

### Superficies
- **Marfil `#fffdf6`**: todo lo que se lee (boletos, tarjetas, modales). Nunca blanco puro: el marfil hace que se sienta papel.
- **Papel `#eef3ee`**: rellenos dentro de las tarjetas, como la pista de la barra de progreso.

### Estado de los números (intocable)
| Color | Significa |
|---|---|
| 🟢 Verde `#16a34a` | Disponible |
| 🟡 Amarillo `#f5c518` | Reservado, esperando pago |
| ⚪ Gris `#d6d9e0` tachado | Vendido |
| Esmeralda + anillo dorado | Lo que el usuario está eligiendo |

Estos colores son el idioma de la app. No se usan para nada más.

### Reglas de color
- El **degradado dorado** es exclusivo del botón **"Ir a pagar"**. Si otro botón brilla, ese deja de destacar.
- El rojo solo aparece en acciones destructivas (Eliminar).
- No usar morado ni azul eléctrico, que son colores típicos de "plantilla de IA".

## Typography

### Familia
**Archivo**, una sola familia. Los títulos usan el eje de ancho expandido (110–112%) para dar presencia sin cambiar de fuente.

### Jerarquía
| Uso | Tamaño | Peso |
|---|---|---|
| Logo | 20px (30px en login) | 800, ancho 112% |
| Título del inicio | 36px / 30px celular | 800, ancho 110% |
| Título de página | 24px | 800 |
| Título de boleto | 18px, máx. 3 líneas | 800 |
| Precio | 24px | 800 |
| Texto | 16px | 400 |
| Secundario | 14px | 400–600 |
| Bolitas | 12.8px | 700 |

### Principios
- **Cifras tabulares** en toda la app, para que los números no "bailen" al cambiar.
- **Montos y conteos** siempre con formato Perú: `S/ 1,500.00`, `1,284` (`money()` y `num()` en `lib/utils.ts`).
- **Singular y plural** siempre correctos con `plural()`: "1 número", "3 números". Nunca "número(s)".
- Sin títulos en MAYÚSCULAS ni etiquetitas encima de cada sección.

## Layout

- Ancho máximo **1024px**, margen lateral **16px**.
- Inicio: bloque de pasos arriba, luego la grilla de boletos (1 columna en celular, 2 en tablet, 3 en computadora).
- Las tarjetas de una fila tienen **la misma altura**; el talón del precio queda siempre abajo.
- Tablero de números: grilla automática de bolitas de 46px mínimo, **100 por página**.
- Todo debe funcionar a **360px** sin scroll horizontal. Los textos largos usan `overflow-wrap: anywhere`.

## Elevation & Depth

- Los boletos flotan sobre la noche con **una sombra difusa negra** (`drop-shadow 0 10px 24px / 45%`).
- Las tarjetas internas no tienen sombra, solo un borde fino `line`.
- Máximo dos niveles de caja. Nada de tarjeta dentro de tarjeta dentro de tarjeta.

## Shapes

- **Boleto:** radio 17.6px, muescas laterales circulares alineadas con la línea perforada. Es la forma firma de la marca: aparece en el logo, el login, las tarjetas y el boleto del inicio.
- Botones e inputs: 12.8px. Tarjetas y modales: 16px. Bolitas: círculo perfecto.
- Fotos de premios: proporción **4:3** en tarjetas, recorte `object-fit: cover`. Si la foto falla, se muestra el ícono del premio (`SafeImg`).

## Components

### Botones
| Tipo | Aspecto | Uso |
|---|---|---|
| Principal | Esmeralda, texto dorado | Acciones normales |
| **Pagar** | Degradado dorado, texto tinta | Solo "Ir a pagar" |
| WhatsApp | Verde | Enviar o reenviar por WhatsApp |
| Claro | Marfil con borde | Cancelar, Volver, Limpiar |
| Peligro | Rojo suave | Eliminar |

Todos se hunden al presionar (`scale(0.97)`). El texto siempre es un verbo: "Ir a pagar", "Confirmar pago", "Liberar".

### Boleto de sorteo (`RaffleCard`)
Foto 4:3, título con ícono (máx. 3 líneas), fecha y línea perforada. En el talón: precio, % vendido y 👤 personas. El % es honesto: "<1%" si se vendió algo, y nunca 100% si queda un número.

### Bolitas (`.ball`)
Verde, amarillo y gris según el estado. Al tocarlas se encogen. El hover solo existe con mouse.

### Selector de página (`Pager`)
`‹ N ›`, con N en píldora esmeralda y texto dorado. Sirve para el tablero y la lista de compradores.

### Ventanas
Modal centrado, entra suave, se cierra con **Esc** o tocando afuera. Las acciones peligrosas piden escribir **ELIMINAR** o **FINALIZAR** letra por letra.

### Barra inferior
Aparece al elegir números y sube desde abajo con curva tipo iPhone.

## Motion

Basado en los principios de Emil Kowalski:

- **Curvas propias**, nunca `ease-in`. `--ease-out` para entradas, `--ease-drawer` para paneles.
- **Menos de 300ms** en todo lo de interfaz. Lo único más largo es el boleto del inicio: es decorativo y ocurre una vez.
- **Solo `transform` y `opacity`.**
- **No se anima lo frecuente:** cambiar de página, elegir números (fuera del toque) y los filtros.
- **Dos momentos "show", ambos del mismo boleto**: el boleto dorado del inicio y el boleto del login, que entran girando y brillan una sola vez. No se agregan videos de fondo: pesan, distraen del formulario y restan confianza.
- **Movimiento reducido:** se quitan los desplazamientos y se mantienen los fundidos.

## Copy

- Español de Perú, tuteo, frases cortas.
- Hablar de **dinero y pasos concretos**: "Paga con Yape", "Confirmamos cada pago a mano". Nada de "revoluciona" ni "experiencia única".
- Los errores dicen qué pasó y qué hacer: "Alguno de esos números acaba de ser tomado. Elige otros."
- Nunca inventar testimonios, ganadores ni cifras.

## Do's and Don'ts

### Do
- Usar marfil para todo lo que se lee y la noche esmeralda de fondo.
- Usar el oro con moderación, para lo que importa.
- Mostrar siempre la **foto real del premio**.
- Confirmar con texto claro cada acción importante.
- Probar cada pantalla con datos difíciles (nombres largos, 10,000 números, sin foto).

### Don't
- No poner el degradado dorado en otro botón que no sea "Ir a pagar".
- No cambiar el significado de verde, amarillo y gris.
- No copiar el estilo de otra marca (Stripe, Apple, casinos conocidos). GoldenTicket tiene su propia identidad.
- No agregar animaciones al hacer scroll, parpadeos ni carruseles automáticos.
- No usar blanco puro, morado ni azul eléctrico.

## Responsive Behavior

| Ancho | Comportamiento |
|---|---|
| < 640px | 1 columna, boleto del inicio arriba del título, botones a lo ancho |
| 640–1023px | 2 columnas de boletos, detalle apilado |
| ≥ 1024px | 3 columnas, detalle con foto a la izquierda (40%) |

- Áreas táctiles de **44px** como mínimo (bolitas de 46px).
- La barra de compra queda fija abajo en todas las pantallas.
