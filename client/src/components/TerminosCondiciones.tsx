import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, Scale, Users, CreditCard, Truck, AlertTriangle, Phone, Mail, MapPin } from 'lucide-react';
import { useStoreConfig } from '../context/StoreContext';

export const TerminosCondiciones: React.FC = () => {
  const { config } = useStoreConfig();
  const storeName = config.name;
  const storeEmail = config.email;
  const storePhone = config.whatsapp;
  const storeCity = config.city || 'Argentina';
  
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <div className="bg-[#1a1a1a] text-white py-12">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
            <ArrowLeft size={20} />
            Volver al inicio
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold">Términos y Condiciones</h1>
          <p className="text-gray-400 mt-2">Última actualización: Diciembre 2024</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Índice */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <FileText size={20} className="text-accent" />
              Índice
            </h2>
            <div className="grid md:grid-cols-2 gap-2 text-sm">
              <a href="#generales" className="text-blue-600 hover:underline">1. Disposiciones Generales</a>
              <a href="#usuario" className="text-blue-600 hover:underline">2. Registro de Usuario</a>
              <a href="#productos" className="text-blue-600 hover:underline">3. Productos y Precios</a>
              <a href="#compra" className="text-blue-600 hover:underline">4. Proceso de Compra</a>
              <a href="#pagos" className="text-blue-600 hover:underline">5. Medios de Pago</a>
              <a href="#envios" className="text-blue-600 hover:underline">6. Envíos y Entregas</a>
              <a href="#devoluciones" className="text-blue-600 hover:underline">7. Devoluciones</a>
              <a href="#privacidad" className="text-blue-600 hover:underline">8. Privacidad de Datos</a>
              <a href="#propiedad" className="text-blue-600 hover:underline">9. Propiedad Intelectual</a>
              <a href="#jurisdiccion" className="text-blue-600 hover:underline">10. Jurisdicción</a>
            </div>
          </div>

          {/* Contenido */}
          <div className="bg-white rounded-xl shadow-sm p-8 space-y-10">
            
            {/* 1. Disposiciones Generales */}
            <section id="generales">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <Shield className="text-accent" size={28} />
                1. Disposiciones Generales
              </h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  Los presentes Términos y Condiciones regulan el uso del sitio web de <strong>{storeName}</strong> 
                  y la relación entre el usuario/consumidor y nuestra empresa.
                </p>
                <p>
                  Al utilizar este sitio web y/o realizar una compra, el usuario acepta íntegramente estos 
                  términos y condiciones, así como nuestra Política de Privacidad.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
                  <p className="text-blue-800">
                    <strong>Marco Legal:</strong> Este contrato se rige por la Ley 24.240 de Defensa del Consumidor, 
                    la Ley 25.326 de Protección de Datos Personales, y demás normativa aplicable en la República Argentina.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-gray-200" />

            {/* 2. Registro de Usuario */}
            <section id="usuario">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <Users className="text-accent" size={28} />
                2. Registro de Usuario
              </h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  El usuario puede realizar compras como invitado o crear una cuenta. Al registrarse, declara:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Ser mayor de 18 años o contar con autorización de sus padres/tutores</li>
                  <li>Proporcionar información veraz, completa y actualizada</li>
                  <li>Mantener la confidencialidad de sus credenciales de acceso</li>
                  <li>Ser responsable de todas las actividades realizadas con su cuenta</li>
                </ul>
                <p>
                  Nos reservamos el derecho de cancelar cuentas que contengan información falsa o 
                  que se utilicen de manera fraudulenta.
                </p>
              </div>
            </section>

            <hr className="border-gray-200" />

            {/* 3. Productos y Precios */}
            <section id="productos">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <FileText className="text-accent" size={28} />
                3. Productos y Precios
              </h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  Todos los precios publicados están expresados en <strong>Pesos Argentinos (ARS)</strong> e 
                  incluyen IVA cuando corresponda.
                </p>
                <p>
                  Las fotografías de los productos son ilustrativas. Pueden existir variaciones mínimas 
                  de color debido a la configuración de pantalla de cada dispositivo.
                </p>
                <p>
                  Nos reservamos el derecho de modificar los precios sin previo aviso. El precio aplicable 
                  será el vigente al momento de confirmar la compra.
                </p>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r">
                  <p className="text-yellow-800">
                    <strong>Disponibilidad:</strong> Todos los productos están sujetos a disponibilidad de stock. 
                    En caso de no poder cumplir con un pedido, nos comunicaremos para ofrecer alternativas o 
                    realizar el reintegro correspondiente.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-gray-200" />

            {/* 4. Proceso de Compra */}
            <section id="compra">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <Scale className="text-accent" size={28} />
                4. Proceso de Compra
              </h2>
              <div className="text-gray-600 space-y-4">
                <p>El proceso de compra consta de los siguientes pasos:</p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>Selección de productos y agregado al carrito</li>
                  <li>Revisión del carrito y confirmación de cantidades</li>
                  <li>Ingreso de datos de envío y facturación</li>
                  <li>Selección del método de pago</li>
                  <li>Confirmación y procesamiento del pago</li>
                  <li>Recepción de email de confirmación con número de pedido</li>
                </ol>
                <p>
                  La compra se considera perfeccionada una vez confirmado el pago. Recibirás un email 
                  con los detalles de tu pedido y podrás hacer seguimiento del mismo.
                </p>
              </div>
            </section>

            <hr className="border-gray-200" />

            {/* 5. Medios de Pago */}
            <section id="pagos">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <CreditCard className="text-accent" size={28} />
                5. Medios de Pago
              </h2>
              <div className="text-gray-600 space-y-4">
                <p>Aceptamos los siguientes medios de pago:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Mercado Pago:</strong> Tarjetas de crédito, débito, dinero en cuenta</li>
                  <li><strong>Transferencia bancaria:</strong> Con 15% de descuento</li>
                </ul>
                <p>
                  Los pagos son procesados de forma segura a través de pasarelas de pago certificadas. 
                  No almacenamos datos de tarjetas de crédito en nuestros servidores.
                </p>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r">
                  <p className="text-green-800">
                    <strong>Pago en cuotas:</strong> Ofrecemos hasta 6 cuotas sin interés con tarjetas seleccionadas 
                    a través de Mercado Pago.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-gray-200" />

            {/* 6. Envíos */}
            <section id="envios">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <Truck className="text-accent" size={28} />
                6. Envíos y Entregas
              </h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  Realizamos envíos a todo el país a través de Correo Argentino y servicios de mensajería.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Los plazos de entrega son estimativos y varían según la zona</li>
                  <li>El cliente recibirá un código de seguimiento una vez despachado el pedido</li>
                  <li>Los costos de envío se calculan al momento del checkout según el código postal</li>
                  <li>Envíos gratis en compras superiores a $200.000</li>
                </ul>
                <p>
                  <strong>Importante:</strong> Al recibir el paquete, verificá que esté en buenas condiciones 
                  antes de firmar. Si presenta daños externos, anotalo en el remito de la empresa de correo.
                </p>
              </div>
            </section>

            <hr className="border-gray-200" />

            {/* 7. Devoluciones */}
            <section id="devoluciones">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <Scale className="text-accent" size={28} />
                7. Devoluciones y Cambios
              </h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  Conforme a la Ley 24.240, tenés los siguientes derechos:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>10 días:</strong> Para ejercer el derecho de arrepentimiento (sin necesidad de justificación)</li>
                  <li><strong>30 días:</strong> Para cambios por fallas o defectos</li>
                  <li><strong>15 días:</strong> Para cambios por talle o color (sujeto a disponibilidad)</li>
                </ul>
                <p>
                  Para más información, consultá nuestra {' '}
                  <Link to="/politicas-devolucion" className="text-blue-600 hover:underline">
                    Política de Devoluciones completa
                  </Link>.
                </p>
              </div>
            </section>

            <hr className="border-gray-200" />

            {/* 8. Privacidad */}
            <section id="privacidad">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <Shield className="text-accent" size={28} />
                8. Privacidad y Protección de Datos
              </h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  Cumplimos con la <strong>Ley 25.326 de Protección de Datos Personales</strong>. 
                  Los datos recopilados serán utilizados exclusivamente para:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Procesar y gestionar pedidos</li>
                  <li>Enviar comunicaciones relacionadas con la compra</li>
                  <li>Mejorar nuestros servicios</li>
                  <li>Enviar promociones (solo con consentimiento previo)</li>
                </ul>
                <p>
                  Podés ejercer tus derechos de acceso, rectificación y supresión de tus datos 
                  contactándonos a {storeEmail}.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
                  <p className="text-blue-800">
                    <strong>Registro ante AAIP:</strong> Los datos son tratados conforme a las disposiciones 
                    de la Agencia de Acceso a la Información Pública.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-gray-200" />

            {/* 9. Propiedad Intelectual */}
            <section id="propiedad">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <FileText className="text-accent" size={28} />
                9. Propiedad Intelectual
              </h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  Todo el contenido del sitio web (textos, imágenes, logos, diseños, código) es propiedad 
                  de {storeName} o de sus respectivos titulares, y está protegido por las leyes de 
                  propiedad intelectual.
                </p>
                <p>
                  Queda prohibida la reproducción, distribución o modificación del contenido sin 
                  autorización expresa y por escrito.
                </p>
              </div>
            </section>

            <hr className="border-gray-200" />

            {/* 10. Jurisdicción */}
            <section id="jurisdiccion">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                <Scale className="text-accent" size={28} />
                10. Jurisdicción y Ley Aplicable
              </h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  Estos términos se rigen por las leyes de la República Argentina. Para cualquier controversia 
                  derivada de estos términos, las partes se someten a la jurisdicción de los tribunales 
                  ordinarios de la ciudad de <strong>{storeCity}</strong>.
                </p>
                <p>
                  Como consumidor, también podés realizar reclamos ante:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Dirección de Defensa del Consumidor de tu localidad</li>
                  <li>COPREC (Consejo de Conciliación Previa en Relaciones de Consumo)</li>
                </ul>
              </div>
            </section>

            {/* Contacto */}
            <div className="bg-gray-50 rounded-xl p-6 mt-8">
              <h3 className="font-bold text-lg mb-4">Datos de Contacto</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <Phone className="text-accent" size={20} />
                  <span className="text-gray-600">{storePhone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="text-accent" size={20} />
                  <span className="text-gray-600">{storeEmail}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="text-accent" size={20} />
                  <span className="text-gray-600">{storeCity}</span>
                </div>
              </div>
            </div>

            {/* Botón de Defensa del Consumidor */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-blue-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <p className="font-medium text-blue-800 mb-2">Defensa del Consumidor</p>
                  <p className="text-blue-700 text-sm">
                    Para consultas o reclamos, podés comunicarte con la Dirección Nacional de Defensa del 
                    Consumidor al <strong>0800-666-1518</strong> o a través de {' '}
                    <a href="https://www.argentina.gob.ar/defensa-del-consumidor" 
                       target="_blank" rel="noopener noreferrer"
                       className="underline hover:text-blue-900">
                      www.argentina.gob.ar/defensa-del-consumidor
                    </a>
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
