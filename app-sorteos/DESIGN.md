---
version: 1.0
name: Gekko
description: Sistema de diseño de Gekko, tienda de pollo aderezado y belleza con un apartado de sorteos, todo con pago por Yape. Noche de carbón cálido como fondo, champán (oro suave) como único acento y tarjetas de papel marfil. Debe transmitir elegancia sobria y, sobre todo, confianza para pagar. Tipografía Archivo con ancho expandido en títulos, cifras tabulares, bolitas de colores para el estado de cada número y movimiento firme y corto.

colors:
  # Marca
  gold: "#d6ad5a"            # champán: logo, acentos, líneas finas, anillo de selección
  gold-deep: "#94702a"       # champán sobre fondos claros cuando se necesita contraste
  gold-soft: "#f4ead6"       # fondo de imágenes vacías y rellenos suaves
  brand: "#1d1814"           # carbón cálido: barra superior, botón principal, pager
  brand-deep: "#110e0b"      # hover del botón principal
  night: "#100d0b"           # fondo de página
  # Superficies
  ivory: "#fffcf7"           # boletos, tarjetas, modales (papel marfil, nunca blanco puro)
  paper: "#f4f0e9"           # pista de barras de progreso, rellenos dentro de tarjetas
  line: "#e7e0d4"            # bordes finos y línea perforada del boleto
  # Texto
  ink: "#221c17"             # texto sobre marfil
  text-on-dark: "#f1ece4"    # texto sobre la noche
  text-on-dark-muted: "rgb(255 255 255 / 0.60)"
  link: "#6b4d16"            # enlaces y precios sobre marfil (bronce)
  # Estado de los números (no cambiar: es el lenguaje de la app)
  ball-available: "#16a34a"  # verde: disponible
  ball-reserved: "#f5c518"   # amarillo: reservado, esperando pago
  ball-reserved-text: "#5c4300"
  ball-sold: "#d6d9e0"       # gris: vendido / pagado
  ball-sold-text: "#6b7280"
  # Acciones especiales
  pay-gradient: "linear-gradient(180deg, #e6c47f, #d6ad5a)"  # SOLO para "Ir a pagar"
  whatsapp: "#15803d"
  danger-bg: "#fee2e2"
  danger-text: "#b91c1c"
  ruby: "#b3262d"            # avisos destructivos puntuales

typography:
  family: "Archivo (Google Fonts, eje de ancho 100–125)"
  display:
    family: "Cormorant Garamond (Google Fonts, 500–700), clase font-display"
    use: "Solo títulos grandes: portada, títulos de sección, títulos de página y el logo en mayúsculas espaciadas (tracking 0.22em). Nunca en texto pequeño, precios, botones ni formularios"
    hero: "42px en celular, 60px en pantalla grande, peso 600, interlineado 1.04"
    section: "30px en celular, 36px en pantalla grande, peso 600"
  eyebrow:
    fontSize: 11.5px          # clase eyebrow
    fontWeight: 600
    letterSpacing: 0.24em
    textTransform: uppercase
    color: gold               # línea pequeña sobre los títulos y categoría en las tarjetas
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
  ball: "Bolita circular de número: verde / amarillo / gris; elegida = carbón con anillo dorado"
  button-primary: "Carbón con texto dorado"
  button-pay: "Degradado dorado, texto tinta. Único botón brillante de la app"
  button-light: "Marfil con borde fino"
  pager: "‹ N › con N en píldora carbón y texto dorado; de 100 en 100"
  bottom-sheet: "Barra fija abajo, blanca 95% con desenfoque, sube con ease-drawer"
  modal: "Centrado, marfil, cierra con Esc y tocando fuera"
  brand-mark: "Monograma G en champán (trazo redondeado) sobre cuadrado de carbón con borde fino + GEKKO en serifa mayúscula espaciada, todo blanco. El mismo monograma es el ícono de la pestaña y del celular"
  winner-banner: "Bloque carbón con borde dorado; número ganador en un disco de oro (mismo oro del boleto del inicio); nombre abreviado 'Juan P.'; botón dorado 'Ver el sorteo en vivo'"
  verify-modal: "Modal marfil estándar para verificar el celular: 3 pasos cortos, botón verde WhatsApp (único uso del verde de acción), código en cifras tabulares y mensaje 'Esperando tu mensaje…'; al terminar muestra ✅ y sigue con la compra. Aviso previo en el tablero: franja 'paper' con borde 'line' (nunca amarillo, que es de 'reservado')"
  product-card: "Tarjeta marfil con borde champán fino y sombra profunda (clase card-lux). Foto cuadrada protagonista (zoom lento al pasar el mouse), categoría en eyebrow, nombre, descripción (3 líneas máx.), línea fina de champán y debajo precio en 26px + botón 'Agregar' que se vuelve selector − 2 +. Agotado: foto en gris con etiqueta 'AGOTADO' en mayúsculas y 'Sin stock' en vez del botón. Con 5 o menos unidades: 'Quedan N unidades' / 'Última unidad' en champán oscuro. Sube 3px al pasar el mouse"
  qty-stepper: "Píldora 'paper' con − (blanco) y + (carbón con texto dorado), 40px de alto en tarjetas y 36px en el carrito; el + se desactiva al llegar al stock"
  cart-bar: "Barra fija abajo (misma del tablero de sorteos): 'N productos · Total S/' y botón carbón 'Ver carrito →'. El único botón dorado del flujo es 'Ir a pagar' dentro del carrito"
  order-chip: "Píldora de estado del pedido: 🟡 Esperando pago (amarillo, igual que 'reservado'), ✅ Pagado (verde), 📦 Entregado (gris), Cancelado (rojo suave)"
  admin-tabs: "Fila de botones Pedidos · Productos · Sorteos · Ajustes; el activo va en oro plano (sin degradado), los demás en blanco 10%"
  terms-page: "/terminos, pública; texto editable por el admin (## títulos, - viñetas) dentro de una tarjeta marfil"
---

# Gekko: sistema de diseño

> Lee este archivo antes de cambiar cualquier pantalla. Si un cambio no encaja aquí, primero se actualiza este archivo y después el código.

## Overview

Gekko vende **pollo aderezado listo para cocinar** y **productos de belleza**, entrega los domingos y cobra por Yape; además tiene un apartado de **sorteos** donde se venden números. La gente paga **antes** de recibir, así que el diseño tiene una sola misión: **que se vea confiable sin dejar de ser apetitoso**.

La base visual es **carbón cálido, champán y papel marfil**: sobria, oscura como tu flyer y sin colores que compitan con la comida ni con los productos de belleza.

- **Noche de carbón:** el fondo, casi negro con un tono cálido (combina con el flyer oscuro de la marca).
- **Champán:** el único acento; líneas finas, botones activos y lo que importa. En dosis pequeñas. Los precios y enlaces sobre marfil usan su versión oscura, el bronce.
- **Papel marfil:** todo lo que se lee (productos, pedidos, modales). El **boleto con muescas** queda solo como forma firma del apartado de sorteos; el logo es el monograma G.

Las fotos de producto mandan: se muestran siempre reales, nunca ilustraciones. Nada parpadea y nada compite con la foto y el precio.

## Colors

### Marca y acento
- **Champán `#d6ad5a`**: logo, número de los pasos, barra de progreso, anillo de la bolita elegida, links sobre fondo oscuro.
- **Carbón `#1d1814`**: barra superior, botón principal, selector de página.
- **Noche `#100d0b`**: fondo de todas las páginas, con dos brillos suaves (champán arriba a la derecha, cobre abajo a la izquierda).

### Superficies
- **Marfil `#fffcf7`**: todo lo que se lee (boletos, tarjetas, modales). Nunca blanco puro: el marfil hace que se sienta papel.
- **Papel `#f4f0e9`**: rellenos dentro de las tarjetas, como la pista de la barra de progreso.

### Estado de los números (intocable)
| Color | Significa |
|---|---|
| 🟢 Verde `#16a34a` | Disponible |
| 🟡 Amarillo `#f5c518` | Reservado, esperando pago |
| ⚪ Gris `#d6d9e0` tachado | Vendido |
| Carbón + anillo dorado | Lo que el usuario está eligiendo |

Estos colores son el idioma de la app. No se usan para nada más.

### Reglas de color
- El **degradado dorado** es exclusivo del botón **"Ir a pagar"**. Si otro botón brilla, ese deja de destacar. El oro metálico de los boletos (boleto del inicio, disco del número ganador, aviso "¡Ganaste!") es otro uso permitido: representa el premio, no es un botón.
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
| Principal | Carbón, texto dorado | Acciones normales |
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
`‹ N ›`, con N en píldora carbón y texto dorado. Sirve para el tablero y la lista de compradores.

### Ventanas
Modal centrado, entra suave, se cierra con **Esc** o tocando afuera. Las acciones peligrosas piden escribir **ELIMINAR** o **FINALIZAR** letra por letra.

### Barra inferior
Aparece al elegir números y sube desde abajo con curva tipo iPhone.

## Tienda y pedidos

- **Pantalla de inicio (`/tienda`):** portada **centrada** con un brillo champán suave arriba: eyebrow (Pollo aderezado · Belleza · Sorteos), titular en serifa grande, línea fina de champán, la regla de entrega y tres sellos en mayúsculas pequeñas separados por rombos. Debajo, selector de categorías centrado (sin emojis) y, por categoría, un título en serifa con línea de champán que se desvanece y la cantidad de productos; luego la grilla (1 columna en celular, 2 en tablet, 3 en computadora, 20px de separación).
- **Stock:** el número de unidades lo pone el admin. El cliente solo ve "¡Quedan N!" cuando son 5 o menos y "Agotado" en 0. El stock se descuenta al hacer el pedido y se devuelve si se cancela.
- **Carrito (`/carrito`):** lista con foto, cantidad y subtotal; datos de entrega; recuadro con total y datos de Yape; **"Ir a pagar 📲"** (único dorado). Si algo se agotó, se quita solo y se avisa con una franja amarilla.
- **Pedido enviado:** tarjeta con ✅, el monto a yapear y botón verde de WhatsApp para enviar la captura.
- **Mis pedidos:** una tarjeta por pedido con su estado; los pendientes muestran cómo pagar y permiten cancelar (con confirmación en el mismo lugar).
- **Admin:** Pedidos (por cobrar / por entregar, con lista de lo que hay que preparar para el domingo), Productos (foto, precio, unidades editables en la fila), Sorteos y Ajustes.
- Los sorteos conservan su diseño completo (boletos, bolitas de estado) sin cambios.

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
- Hablar de **dinero y pasos concretos**: "Paga con Yape", "Confirmamos cada pago a mano", "Entregamos todos los domingos". Nada de "revoluciona" ni "experiencia única".
- Los errores dicen qué pasó y qué hacer: "Alguno de esos números acaba de ser tomado. Elige otros."
- Nunca inventar testimonios, ganadores ni cifras.

## Do's and Don'ts

### Do
- Usar marfil para todo lo que se lee y la noche de carbón de fondo.
- Sensación de exclusividad = **menos, pero mejor**: mucho aire, un solo acento (champán), líneas finas en vez de cajas gruesas, serifa solo en títulos grandes, mayúsculas espaciadas solo en etiquetas pequeñas. Nada de emojis en títulos, menú ni filtros (solo en mensajes de WhatsApp y estados).
- Usar el oro con moderación, para lo que importa.
- Mostrar siempre la **foto real del premio**.
- Confirmar con texto claro cada acción importante.
- Probar cada pantalla con datos difíciles (nombres largos, 10,000 números, sin foto).

### Don't
- No poner el degradado dorado en otro botón que no sea "Ir a pagar".
- No cambiar el significado de verde, amarillo y gris.
- No copiar el estilo de otra marca (Stripe, Apple, casinos conocidos). Gekko tiene su propia identidad.
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
