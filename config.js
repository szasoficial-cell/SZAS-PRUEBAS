/* ==========================================================================
   CONFIG.JS — ÚNICO ARCHIVO QUE DEBES EDITAR PARA AGREGAR/CAMBIAR PRODUCTOS
   No hay lógica aquí, solo datos. app.js lee todo esto automáticamente.
   ========================================================================== */

/* Número de WhatsApp de SZAS (con código de país, sin +, sin espacios) */
const WHATSAPP_NUMBER = "573224982212";

/* Redes sociales de SZAS
   Cambia estas URLs cuando tengas tus perfiles definitivos. */
const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/szas.official/",
  tiktok: "https://www.tiktok.com/@szas.oficial",
  whatsapp: `https://wa.me/${WHATSAPP_NUMBER}`
};

/* Tallas disponibles para prendas normales */
const SIZES = ["S", "M", "L", "XL", "XXL"];

/* ==========================================================================
   CATEGORÍAS DEL MENÚ PRINCIPAL
   Regla de marca SZAS: el menú de navegación SOLO debe tener estas tres.
   No agregues categorías nuevas aquí salvo que la marca cambie de criterio.
   Cada producto de abajo debe usar EXACTAMENTE uno de estos valores.
   ========================================================================== */
const CATEGORIES = ["TODO", "TOPS", "OUTERWEAR"];

/* ==========================================================================
   GUÍAS DE TALLAS
   Cada producto referencia una guía por su "id" (ver sizeGuide en PRODUCTS).
   Para agregar una guía nueva, solo añade una entrada aquí.
   ========================================================================== */
const SIZE_GUIDES = {
  camisa: {
    title: "GUÍA DE TALLAS — CAMISA",
    headers: ["Talla", "Pecho", "Largo", "Hombro", "Manga"],
    rows: [
      ["S", "92–96 cm", "68 cm", "44 cm", "22 cm"],
      ["M", "96–100 cm", "70 cm", "46 cm", "23 cm"],
      ["L", "100–105 cm", "72 cm", "48 cm", "24 cm"],
      ["XL", "105–110 cm", "74 cm", "50 cm", "25 cm"],
      ["XXL", "110–115 cm", "76 cm", "52 cm", "26 cm"]
    ]
  },
  saco: {
    title: "GUÍA DE TALLAS — SACO",
    headers: ["Talla", "Pecho", "Cintura", "Cadera"],
    rows: [
      ["S", "92–96 cm", "76–80 cm", "92–96 cm"],
      ["M", "96–100 cm", "80–84 cm", "96–100 cm"],
      ["L", "100–105 cm", "84–89 cm", "100–105 cm"],
      ["XL", "105–110 cm", "89–94 cm", "105–110 cm"],
      ["XXL", "110–115 cm", "94–99 cm", "110–115 cm"]
    ]
  },
hoodie: {
    title: "GUÍA DE TALLAS — HOODIE",
    headers: ["Talla", "Pecho", "Largo", "Hombro", "Manga"],
    rows: [
      ["S", "104 cm", "66 cm", "52 cm", "60 cm"],
      ["M", "110 cm", "68 cm", "54 cm", "62 cm"],
      ["L", "116 cm", "70 cm", "56 cm", "64 cm"],
      ["XL", "122 cm", "72 cm", "58 cm", "66 cm"],
      ["XXL", "128 cm", "74 cm", "60 cm", "68 cm"]
    ]
  }
};
/* ==========================================================================
   PRODUCTOS
   Para agregar un producto nuevo, copia un bloque { ... } y cambia los datos.

   Campos normales:
     id          -> único, sin espacios ni tildes (ej: "camisa-negra-02")
     name        -> nombre visible en la tienda
     category    -> debe ser "TOPS" u "OUTERWEAR" (nunca "TODO")
     price       -> número, sin puntos ni signos ($)
     images      -> array de rutas dentro de la carpeta imagenes/
     description -> texto corto que se ve en el detalle del producto
     sizeGuide   -> clave que existe en SIZE_GUIDES (opcional)

   Producto tipo CONJUNTO (dos prendas, tallas independientes):
     bundle: true
     bundlePrice -> precio del conjunto completo
     components  -> lista de piezas, cada una con:
         id        -> debe existir como producto normal más abajo
         label     -> texto mostrado en el selector ("SUDADERA", "CHAQUETA")
   ========================================================================== */
const PRODUCTS = [
  {
    id: "camisa-3-drop",
    name: "CAMISA 3 DROP",
    category: "TOPS",
    price: 35000,
    images: ["imagenes/camisa-1.jpg", "imagenes/camisa-2.jpg", "imagenes/camisa-3.jpg", "imagenes/camisa-4.jpg"],
    description: "Prenda SZAS. Selecciona tu talla para continuar.",
    sizeGuide: "camisa",
    colors: [
      { name: "BLANCO", images: ["imagenes/camisa-blanco-1.jpg", "imagenes/camisa-blanco-2.jpg"] },
      { name: "NEGRO", images: ["imagenes/camisa-negro-1.jpg", "imagenes/camisa-negro-2.jpg"] }
    ]
  },
  {
    id: "hoodie-3-drop",
    name: "HOODIE 3 DROP",
    category: "OUTERWEAR",
    price: 75000,
    images: ["imagenes/hoodie-1.jpg", "imagenes/hoodie-2.jpg"],
    description: "Hoodie SZAS. Selecciona tu talla para continuar.",
    sizeGuide: "hoodie",
    colors: [
      { name: "BLANCO", images: ["imagenes/hoodie-blanco-1.jpg", "imagenes/hoodie-blanco-2.jpg"] },
      { name: "NEGRO", images: ["imagenes/hoodie-negro-1.jpg", "imagenes/hoodie-negro-2.jpg"] }
    ]
  },
  {
    id: "chaqueta-szas",
    name: "CHAQUETA / SACO BASICO",
    category: "OUTERWEAR",
    price: 70000,
    images: ["imagenes/chaqueta-1.jpg", "imagenes/chaqueta-2.jpg"],
    description: "Chaqueta / saco SZAS. Selecciona tu talla para continuar.",
    sizeGuide: "saco",
    colors: [
      { name: "BLANCO", images: ["imagenes/chaqueta-blanco-1.jpg", "imagenes/chaqueta-blanco-2.jpg"] },
      { name: "NEGRO", images: ["imagenes/chaqueta-negro-1.jpg", "imagenes/chaqueta-negro-2.jpg"] }
    ]
  },
  {
    id: "conjunto-szas",
    name: "CONJUNTO SZAS",
    category: "OUTERWEAR",
    bundle: true,
    bundlePrice: 155000,
    images: ["imagenes/conjunto-1.jpg", "imagenes/conjunto-2.jpg", "imagenes/conjunto-3.jpg"],
    description: "Sudadera oversized + chaqueta. Puedes comprarlas juntas o por separado.",
    components: [
      { id: "hoodie-3-drop", label: "SUDADERA" },
      { id: "chaqueta-szas", label: "CHAQUETA" }
    ]
  }
];
