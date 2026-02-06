import React from 'react';
import { Navbar, Footer } from './Layout';
import { useStoreConfig } from '../context/StoreContext';
import { BlockRenderer } from './blocks/BlockRenderer';
import { Store } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { config } = useStoreConfig();

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F5]">
      <Navbar onMenuClick={() => {}} />
      
      <main className="flex-grow">
        {/* Render blocks if they exist */}
        {config.aboutBlocks && config.aboutBlocks.length > 0 ? (
          <>
            {config.aboutBlocks
              .filter(block => block.isActive)
              .sort((a, b) => a.order - b.order)
              .map(block => (
                <BlockRenderer key={block.id} block={block} />
              ))}
          </>
        ) : (
          /* Fallback content if no blocks */
          <section className="max-w-4xl mx-auto px-6 py-16">
            <div className="text-center text-gray-500">
              <Store size={64} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Contenido no configurado</p>
              <p className="text-sm">Editá esta sección en Admin → Sobre Nosotros</p>
            </div>
          </section>
        )}
      </main>
      
      <Footer />
    </div>
  );
};
