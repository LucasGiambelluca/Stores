import React, { useState } from 'react';
import { ChevronDown, Mail, MessageCircle, MapPin, Truck, CreditCard, Package, Clock, HelpCircle } from 'lucide-react';
import { Navbar, Footer } from './Layout';
import { useFAQs, useStoreConfig } from '../context/StoreContext';
import { FAQItem as FAQItemType } from '../types';

interface AccordionItem {
  question: string;
  answer: React.ReactNode;
  icon: React.ReactNode;
  category: string;
}

const FAQAccordion: React.FC<{ item: AccordionItem; isOpen: boolean; onToggle: () => void }> = ({ 
  item, isOpen, onToggle 
}) => {
  return (
    <div className="faq-item">
      <button 
        onClick={onToggle}
        className={`faq-question ${isOpen ? 'active' : ''}`}
      >
        <div className="faq-question-content">
          <span className="faq-icon">{item.icon}</span>
          <span className="faq-question-text">{item.question}</span>
        </div>
        <ChevronDown 
          size={20} 
          className={`faq-chevron ${isOpen ? 'rotate' : ''}`}
        />
      </button>
      <div className={`faq-answer ${isOpen ? 'open' : ''}`}>
        <div className="faq-answer-content">
          {item.answer}
        </div>
      </div>
    </div>
  );
};

// Get icon for FAQ category
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'compras': return <Package size={20} />;
    case 'pagos': return <CreditCard size={20} />;
    case 'envios': return <Truck size={20} />;
    default: return <HelpCircle size={20} />;
  }
};

export const FAQPage: React.FC = () => {
  const { faqs } = useFAQs();
  const { config } = useStoreConfig();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Convert FAQs from context to accordion format
  const faqItems: AccordionItem[] = faqs.map(faq => ({
    question: faq.question,
    icon: getCategoryIcon(faq.category),
    category: faq.category,
    answer: <div dangerouslySetInnerHTML={{ __html: faq.answer }} />
  }));

  const categories = [
    { id: 'all', label: 'Todas' },
    { id: 'compras', label: 'Compras' },
    { id: 'pagos', label: 'Pagos' },
    { id: 'envios', label: 'Envíos' },
    { id: 'general', label: 'General' }
  ];

  const filteredItems = activeCategory === 'all' 
    ? faqItems 
    : faqItems.filter(item => item.category === activeCategory);

  // Format whatsapp number
  const whatsappNumber = config.whatsapp.replace(/[^0-9]/g, '');

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <Navbar onMenuClick={() => {}} />
      
      <main className="flex-1">
        {/* Hero Header */}
        <div style={{ backgroundColor: config.colors.primary }} className="text-white py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Preguntas <span style={{ color: config.colors.accent }}>Frecuentes</span>
            </h1>
            <p className="text-gray-400 text-lg">
              Todo lo que necesitás saber sobre tu compra
            </p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    activeCategory === cat.id
                      ? 'bg-[#1a1a1a] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ List */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="faq-container">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <FAQAccordion
                  key={index}
                  item={item}
                  isOpen={openIndex === index}
                  onToggle={() => setOpenIndex(openIndex === index ? null : index)}
                />
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <HelpCircle size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No hay preguntas en esta categoría</p>
              </div>
            )}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="bg-white py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 md:p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100">
              <h2 className="text-2xl font-bold mb-3 text-gray-900">¿No encontraste lo que buscabas?</h2>
              <p className="text-gray-500 mb-8 max-w-lg mx-auto">
                Nuestro equipo está disponible para ayudarte. Escribinos y te responderemos a la brevedad.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-white px-8 py-3 rounded-lg font-bold hover:opacity-90 transition-all shadow-md transform hover:-translate-y-0.5"
                  style={{ backgroundColor: config.colors.primary }}
                >
                  <MessageCircle size={20} />
                  WhatsApp
                </a>
                <a
                  href={`mailto:${config.email}`}
                  className="flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-semibold transition-all border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                >
                  <Mail size={20} />
                  Enviar Email
                </a>
              </div>

              <p className="text-xs text-gray-400 mt-8">
                Te recomendamos usar un solo canal de comunicación para agilizar tu consulta.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
