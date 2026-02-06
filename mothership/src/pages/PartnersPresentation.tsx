import { motion } from 'framer-motion';
import { 
  Palette, 
  Zap, 
  TrendingUp, 
  Gift, 
  Headphones, 
  Briefcase,
  Printer,
  ArrowRight,
  CheckCircle2,
  Globe,
  Smartphone
} from 'lucide-react';

const PartnersPresentation = () => {
  const handlePrint = () => {
    window.print();
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-lime-500 selection:text-white print:bg-white print:text-black">
      {/* Navigation / Print Button */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-center bg-black/80 backdrop-blur-md border-b border-white/10 print:hidden">
        <div className="text-2xl font-display font-bold tracking-tighter">
          Lime<span className="text-lime-400">Store</span>
        </div>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-sm font-medium"
        >
          <Printer size={16} />
          <span>Guardar como PDF</span>
        </button>
      </nav>

      {/* Print Header (Only visible in print) */}
      <div className="hidden print:block mb-8 pt-8 border-b border-black pb-4">
        <div className="text-3xl font-bold text-black">LimeStore Partners</div>
        <div className="text-sm text-gray-600">Propuesta de Alianza Estratégica 2026</div>
      </div>

      <main className="max-w-6xl mx-auto px-6 pt-32 pb-20 print:pt-0 print:pb-0">
        
        {/* Hero Section */}
        <section className="min-h-[80vh] flex flex-col justify-center mb-20 print:min-h-0 print:mb-12 print:break-after-page">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="space-y-8"
          >
            <motion.div variants={fadeInUp} className="inline-block px-3 py-1 rounded-full bg-primary-500/10 text-primary-400 text-sm font-medium border border-primary-500/20 print:border-black print:text-black print:bg-transparent">
              Programa de Partners 2026
            </motion.div>
            <motion.h1 variants={fadeInUp} className="text-6xl md:text-8xl font-display font-bold leading-tight tracking-tight print:text-5xl">
              El Arte del <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400 print:text-black">Comercio Digital</span>
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-gray-400 max-w-2xl leading-relaxed print:text-gray-700">
              No solo construimos tiendas online; diseñamos experiencias. Únete a nosotros para democratizar el diseño de vanguardia para la nueva generación de negocios en Latinoamérica.
            </motion.p>
          </motion.div>
        </section>

        {/* Showcase Section (New) */}
        <section className="mb-32 print:mb-12 print:break-after-page">
           <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-primary-500/10 print:border-gray-300 print:shadow-none"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-void via-transparent to-transparent z-10 print:hidden"></div>
            <img 
              src="/assets/demo-home.png" 
              alt="LimeStore Demo Store Homepage" 
              className="w-full h-auto object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 p-8 z-20 print:relative print:p-4 print:text-black">
              <h3 className="text-2xl font-bold mb-2">Experiencia Visual Inmersiva</h3>
              <p className="text-gray-300 print:text-gray-600">Nuestras tiendas están optimizadas para retener la atención y maximizar la conversión.</p>
            </div>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-8 mt-8">
             <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl overflow-hidden border border-white/10 print:border-gray-200"
            >
              <img src="/assets/demo-product.png" alt="Product Detail" className="w-full h-64 object-cover object-top" />
              <div className="p-6 bg-surface print:bg-white">
                <h4 className="text-xl font-bold mb-2">Diseño de Producto Premium</h4>
                <p className="text-gray-400 text-sm print:text-gray-600">Cada detalle está pensado para resaltar el valor de la marca.</p>
              </div>
            </motion.div>
             <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 bg-surface rounded-2xl border border-white/10 flex flex-col justify-center print:bg-white print:border-gray-200"
            >
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary-500/10 rounded-lg text-primary-400 print:bg-gray-100 print:text-black">
                    <Smartphone size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold">Mobile First</h4>
                    <p className="text-gray-400 text-sm print:text-gray-600">Experiencia nativa en cualquier dispositivo.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary-500/10 rounded-lg text-primary-400 print:bg-gray-100 print:text-black">
                    <Globe size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold">SEO Automático</h4>
                    <p className="text-gray-400 text-sm print:text-gray-600">Posicionamiento orgánico sin configuraciones complejas.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary-500/10 rounded-lg text-primary-400 print:bg-gray-100 print:text-black">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold">Velocidad Extrema</h4>
                    <p className="text-gray-400 text-sm print:text-gray-600">Carga instantánea gracias a nuestra arquitectura moderna.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Philosophy Section */}
        <section className="mb-32 print:mb-12 print:break-inside-avoid">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">Nuestra Filosofía</h2>
              <div className="space-y-4 text-lg text-gray-300 print:text-gray-800">
                <p>
                  En <strong className="text-white print:text-black">LimeStore</strong>, creemos que el e-commerce no debe ser una barrera técnica, sino un lienzo para la expresión de marca.
                </p>
                <p>
                  Nuestra misión es empoderar a las agencias y consultores para que ofrezcan soluciones de talla mundial a sus clientes, sin los dolores de cabeza del desarrollo a medida.
                </p>
                <p>
                  Valoramos la <span className="text-primary-400 font-medium print:text-black">Estética</span>, la <span className="text-primary-400 font-medium print:text-black">Velocidad</span> y la <span className="text-primary-400 font-medium print:text-black">Simplicidad</span>.
                </p>
              </div>
            </div>
            <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-surface to-elevated border border-white/5 flex items-center justify-center print:hidden">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
              <Palette size={64} className="text-primary-500/50" />
            </div>
          </motion.div>
        </section>

        {/* Proposal Section */}
        <section className="mb-32 print:mb-12 print:break-inside-avoid">
          <div className="bg-gradient-to-br from-primary-900/20 to-void border border-primary-500/20 rounded-3xl p-12 text-center relative overflow-hidden print:bg-white print:border-black print:text-left print:p-0">
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">Crezcamos Juntos</h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 print:text-gray-700">
                Buscamos socios estratégicos que compartan nuestra visión de excelencia. Agencias de marketing, estudios de diseño y consultores que quieran elevar el estándar de sus servicios.
              </p>
              <div className="inline-flex items-center gap-2 text-primary-400 font-medium print:text-black">
                <Briefcase size={20} />
                <span>No buscamos vendedores, buscamos Embajadores.</span>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="mb-32 print:mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-12 text-center">Beneficios Exclusivos</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-surface p-8 rounded-2xl border border-white/5 relative overflow-hidden group print:bg-white print:border-gray-200"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity print:hidden">
                <TrendingUp size={100} />
              </div>
              <div className="text-4xl font-bold text-primary-400 mb-2 print:text-black">30%</div>
              <h3 className="text-xl font-bold mb-4">Margen de Ganancia</h3>
              <p className="text-gray-400 print:text-gray-600">Comisión recurrente en nuestras licencias más exclusivas (Business y Enterprise). Tu éxito es nuestro éxito.</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-500 print:text-gray-600">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-primary-400 print:text-black" /> Pagos mensuales</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-primary-400 print:text-black" /> Dashboard de partner</li>
              </ul>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-surface p-8 rounded-2xl border border-white/5 relative overflow-hidden group print:bg-white print:border-gray-200"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity print:hidden">
                <Gift size={100} />
              </div>
              <div className="text-4xl font-bold text-primary-400 mb-2 print:text-black">Gratis</div>
              <h3 className="text-xl font-bold mb-4">Licencia PRO (1 Año)</h3>
              <p className="text-gray-400 print:text-gray-600">Vive la experiencia LimeStore. Una licencia PRO completa por 12 meses para tu propio negocio o demos.</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-500 print:text-gray-600">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-primary-400 print:text-black" /> Valorada en $XXX</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-primary-400 print:text-black" /> Acceso total</li>
              </ul>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-surface p-8 rounded-2xl border border-white/5 relative overflow-hidden group print:bg-white print:border-gray-200"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity print:hidden">
                <Headphones size={100} />
              </div>
              <div className="text-4xl font-bold text-primary-400 mb-2 print:text-black">VIP</div>
              <h3 className="text-xl font-bold mb-4">Soporte Prioritario</h3>
              <p className="text-gray-400 print:text-gray-600">Acceso directo a nuestro equipo de desarrollo. Tus dudas y las de tus clientes son prioridad #1.</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-500 print:text-gray-600">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-primary-400 print:text-black" /> Canal exclusivo</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-primary-400 print:text-black" /> Respuesta en &lt; 2hs</li>
              </ul>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center print:break-inside-avoid">
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-8">Únete a la Revolución</h2>
          <p className="text-xl text-gray-400 mb-12 print:text-gray-700">El comercio electrónico está evolucionando. No te quedes atrás.</p>
          
          <div className="inline-flex flex-col items-center gap-4 p-8 bg-white/5 rounded-2xl border border-white/10 print:bg-transparent print:border-black">
            <div className="text-lg font-medium">Contáctanos hoy para activar tu cuenta de Partner</div>
            <a href="mailto:partners@limestore.com" className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors text-xl font-bold print:text-black print:no-underline">
              partners@limestore.com <ArrowRight size={20} />
            </a>
            <div className="text-gray-500">www.limestore.com</div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-gray-500 text-sm print:hidden">
        &copy; 2026 LimeStore Inc. Todos los derechos reservados.
      </footer>
    </div>
  );
};

export default PartnersPresentation;
