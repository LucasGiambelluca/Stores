// Policy storage utilities - shared between admin and frontend

export const DEFAULT_RETURN_POLICY = `# Políticas de Devolución y Cambios

**Conforme a la Ley 24.240 de Defensa del Consumidor**

## Derecho de Arrepentimiento

Conforme al Artículo 34 de la Ley 24.240, el consumidor tiene derecho a revocar la aceptación durante el plazo de **DIEZ (10) días corridos** contados a partir de la fecha en que se entregue el bien o se celebre el contrato.

> No necesitás dar explicaciones. Es tu derecho como consumidor.

Para ejercer este derecho, el producto debe encontrarse en perfectas condiciones, sin uso, con todas sus etiquetas originales y en su empaque original.

## Cambios por Defectos o Fallas

Si recibiste un producto con fallas de fabricación o diferente al solicitado, tenés **30 días** para solicitar el cambio o devolución del dinero.

### Cómo proceder:
1. Contactanos por WhatsApp o email
2. Enviá fotos del producto y descripción del problema
3. Te indicamos cómo enviarnos el producto
4. Una vez recibido y verificado, procedemos al cambio o reintegro

## Cambios por Talle o Color

Aceptamos cambios por talle o color dentro de los **15 días** de recibido el producto, sujeto a disponibilidad de stock.

### Condiciones:
- El producto debe estar sin uso
- Con etiquetas originales
- En su empaque original

## Costos de Envío

- **Arrepentimiento:** Los costos de devolución corren por cuenta del vendedor
- **Defectos:** Los costos corren por cuenta del vendedor
- **Cambio de talle:** Los costos de envío corren por cuenta del comprador

## Reintegros

Los reintegros se realizan por el mismo medio de pago utilizado en la compra original, en un plazo máximo de 10 días hábiles.

## Contacto

Para cualquier consulta sobre devoluciones, contactanos y te ayudamos.`;

export const DEFAULT_TERMS = `# Términos y Condiciones

**Última actualización: Diciembre 2024**

## 1. Disposiciones Generales

Al utilizar este sitio web y/o realizar una compra, el usuario acepta íntegramente estos términos y condiciones, así como nuestra Política de Privacidad.

> **Marco Legal:** Este contrato se rige por la Ley 24.240 de Defensa del Consumidor, la Ley 25.326 de Protección de Datos Personales, y demás normativa aplicable en la República Argentina.

## 2. Registro de Usuario

El usuario puede realizar compras como invitado o crear una cuenta. Al registrarse, declara:
- Ser mayor de 18 años o contar con autorización de sus padres/tutores
- Proporcionar información veraz, completa y actualizada
- Mantener la confidencialidad de sus credenciales de acceso

## 3. Productos y Precios

- Todos los precios están en **Pesos Argentinos (ARS)** e incluyen IVA
- Las fotografías son ilustrativas, pueden existir variaciones mínimas de color
- Los precios pueden modificarse sin previo aviso

> **Disponibilidad:** Todos los productos están sujetos a disponibilidad de stock.

## 4. Proceso de Compra

1. Selección de productos y agregado al carrito
2. Revisión del carrito y confirmación de cantidades
3. Ingreso de datos de envío y facturación
4. Selección del método de pago
5. Confirmación y procesamiento del pago
6. Recepción de email de confirmación

## 5. Medios de Pago

Aceptamos:
- **Mercado Pago:** Tarjetas de crédito, débito, dinero en cuenta
- **Transferencia bancaria:** Con descuento especial

Los pagos son procesados de forma segura. No almacenamos datos de tarjetas en nuestros servidores.

## 6. Envíos y Entregas

- Los plazos de entrega son estimativos y varían según la zona
- Recibirás un código de seguimiento una vez despachado
- Los costos se calculan según el código postal

## 7. Devoluciones y Cambios

Conforme a la Ley 24.240:
- **10 días:** Derecho de arrepentimiento
- **30 días:** Cambios por fallas o defectos
- **15 días:** Cambios por talle o color

## 8. Privacidad y Protección de Datos

Cumplimos con la Ley 25.326. Los datos se utilizan para:
- Procesar y gestionar pedidos
- Enviar comunicaciones de la compra
- Enviar promociones (solo con consentimiento)

## 9. Propiedad Intelectual

Todo el contenido del sitio está protegido por las leyes de propiedad intelectual. Queda prohibida la reproducción sin autorización.

## 10. Jurisdicción

Estos términos se rigen por las leyes de Argentina. Para reclamos: Defensa del Consumidor **0800-666-1518**`;

// Get saved policy content (returns default if not customized)
export const getReturnPolicy = (): string => {
  if (typeof window === 'undefined') return DEFAULT_RETURN_POLICY;
  return sessionStorage.getItem('store_returnPolicy') || DEFAULT_RETURN_POLICY;
};

export const getTermsPolicy = (): string => {
  if (typeof window === 'undefined') return DEFAULT_TERMS;
  return sessionStorage.getItem('store_termsPolicy') || DEFAULT_TERMS;
};

// Simple markdown to HTML converter
export const renderMarkdown = (md: string): string => {
  return md
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-6 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-8 mb-4 pb-2 border-b border-gray-200">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 text-blue-800 rounded-r">$1</blockquote>')
    .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 list-decimal">$1</li>')
    .replace(/\n\n/g, '</p><p class="my-3">')
    .replace(/\n/g, '<br/>');
};
