import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, AlertTriangle, Phone, Mail } from 'lucide-react';
import { useStoreConfig } from '../context/StoreContext';

export const PoliticasDevolucion: React.FC = () => {
  const { config } = useStoreConfig();
  
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <div className="bg-[#1a1a1a] text-white py-12">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
            <ArrowLeft size={20} />
            Volver al inicio
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold">Políticas de Devolución y Cambios</h1>
          <p className="text-gray-400 mt-2">Conforme a la Ley 24.240 de Defensa del Consumidor</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Resumen visual */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="text-green-600" size={24} />
              </div>
              <h3 className="font-bold text-lg mb-2">10 Días</h3>
              <p className="text-gray-600 text-sm">Para arrepentimiento de compra (compras online)</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="text-blue-600" size={24} />
              </div>
              <h3 className="font-bold text-lg mb-2">30 Días</h3>
              <p className="text-gray-600 text-sm">Para cambios por fallas o defectos</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-purple-600" size={24} />
              </div>
              <h3 className="font-bold text-lg mb-2">Garantía</h3>
              <p className="text-gray-600 text-sm">6 meses por defectos de fabricación</p>
            </div>
          </div>

          {/* Contenido legal */}
          <div className="bg-white rounded-xl shadow-sm p-8 space-y-8">
            
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary)' }}>1</span>
                Derecho de Arrepentimiento
              </h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  Conforme al <strong>Artículo 34 de la Ley 24.240</strong>, el consumidor tiene derecho a revocar 
                  la aceptación durante el plazo de <strong>DIEZ (10) días corridos</strong> contados a partir de 
                  la fecha en que se entregue el bien o se celebre el contrato, lo último que ocurra.
                </p>
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r">
                  <p className="font-medium text-green-800">
                    No necesitás dar explicaciones. Es tu derecho como consumidor.
                  </p>
                </div>
                <p>
                  Para ejercer este derecho, el producto debe encontrarse en perfectas condiciones, 
                  sin uso, con todas sus etiquetas originales y en su empaque original.
                </p>
              </div>
            </section>

            <hr className="border-gray-200" />

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary)' }}>2</span>
                Cambios por Fallas o Defectos
              </h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  Según los <strong>Artículos 11 y 17 de la Ley 24.240</strong>, cuando el producto presente 
                  vicios o defectos que lo hagan impropio para su destino, tenés derecho a:
                </p>
                <ul className="list-none space-y-2">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={18} />
                    <span>La sustitución del producto por otro de idénticas características</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={18} />
                    <span>La devolución del importe abonado (reintegro total)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={18} />
                    <span>Una quita proporcional del precio</span>
                  </li>
                </ul>
                <p>
                  Este derecho puede ejercerse dentro de los <strong>30 días</strong> de recibido el producto.
                </p>
              </div>
            </section>

            <hr className="border-gray-200" />

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary)' }}>3</span>
                Cambios por Talle o Color
              </h2>
              <div className="text-gray-600 space-y-4">
                <p>
                  Ofrecemos cambios por talle o color dentro de los <strong>15 días</strong> de recibido el producto, 
                  sujeto a disponibilidad de stock. Requisitos:
                </p>
                <ul className="list-none space-y-2">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={18} />
                    <span>Producto sin uso y en perfectas condiciones</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={18} />
                    <span>Etiquetas originales intactas</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={18} />
                    <span>Empaque original</span>
                  </li>
                </ul>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r">
                  <p className="text-yellow-800">
                    <strong>Importante:</strong> Los gastos de envío del cambio corren por cuenta del cliente, 
                    salvo que se trate de un error nuestro o defecto del producto.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-gray-200" />

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">!</span>
                Productos No Aceptados para Devolución
              </h2>
              <div className="text-gray-600 space-y-4">
                <ul className="list-none space-y-2">
                  <li className="flex items-start gap-3">
                    <XCircle className="text-red-500 mt-1 flex-shrink-0" size={18} />
                    <span>Productos usados, lavados o con signos de uso</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="text-red-500 mt-1 flex-shrink-0" size={18} />
                    <span>Productos sin etiquetas originales</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="text-red-500 mt-1 flex-shrink-0" size={18} />
                    <span>Ropa interior, trajes de baño y artículos de higiene</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="text-red-500 mt-1 flex-shrink-0" size={18} />
                    <span>Productos personalizados o modificados a pedido</span>
                  </li>
                </ul>
              </div>
            </section>

            <hr className="border-gray-200" />

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary)' }}>4</span>
                Cómo Solicitar una Devolución o Cambio
              </h2>
              <div className="text-gray-600 space-y-4">
                <ol className="list-decimal list-inside space-y-3">
                  <li>
                    <strong>Contactanos</strong> por WhatsApp o email indicando tu número de pedido y motivo.
                  </li>
                  <li>
                    Te enviaremos las instrucciones para el envío del producto.
                  </li>
                  <li>
                    Una vez recibido y verificado el producto, procesaremos el cambio o reintegro.
                  </li>
                  <li>
                    El reintegro se realizará por el mismo medio de pago utilizado, en un plazo máximo de 10 días hábiles.
                  </li>
                </ol>
              </div>
            </section>

            <hr className="border-gray-200" />

            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Contacto para Devoluciones</h2>
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <Phone className="text-white" size={20} />
                  </div>
                  <div>
                    <p className="font-medium">WhatsApp</p>
                    <p className="text-gray-600">+54 9 2914 16-3569</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <Mail className="text-white" size={20} />
                  </div>
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-gray-600">xmenosmasprendasbb@gmail.com</p>
                  </div>
                </div>
              </div>
            </section>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-8">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-blue-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <p className="font-medium text-blue-800 mb-2">Marco Legal</p>
                  <p className="text-blue-700 text-sm">
                    Estas políticas se rigen por la <strong>Ley 24.240 de Defensa del Consumidor</strong> y 
                    sus modificatorias, incluyendo la Ley 26.361 y la Resolución 424/2020 de la Secretaría de 
                    Comercio Interior sobre comercio electrónico.
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
