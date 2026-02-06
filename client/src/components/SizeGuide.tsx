import React, { useState } from 'react';
import { X, Ruler, Info } from 'lucide-react';

interface SizeGuideProps {
  isOpen?: boolean;
  onClose?: () => void;
  category?: string;
  title?: string;
  mode?: 'standard' | 'image';
  imageUrl?: string;
  embedded?: boolean;
}

const WOMEN_SIZES = [
  { size: 'XS', pecho: '80-84', cintura: '60-64', cadera: '84-88' },
  { size: 'S', pecho: '85-89', cintura: '65-69', cadera: '89-93' },
  { size: 'M', pecho: '90-94', cintura: '70-74', cadera: '94-98' },
  { size: 'L', pecho: '95-99', cintura: '75-79', cadera: '99-103' },
  { size: 'XL', pecho: '100-104', cintura: '80-84', cadera: '104-108' },
  { size: 'XXL', pecho: '105-110', cintura: '85-90', cadera: '109-114' },
];

const MEN_SIZES = [
  { size: 'S', pecho: '88-92', cintura: '73-77', cadera: '88-92' },
  { size: 'M', pecho: '93-97', cintura: '78-82', cadera: '93-97' },
  { size: 'L', pecho: '98-102', cintura: '83-87', cadera: '98-102' },
  { size: 'XL', pecho: '103-107', cintura: '88-92', cadera: '103-107' },
  { size: 'XXL', pecho: '108-114', cintura: '93-99', cadera: '108-114' },
];

export const SizeGuide: React.FC<SizeGuideProps> = ({ 
  isOpen, 
  onClose, 
  category = 'mujer',
  title = 'Guía de Talles',
  mode = 'standard',
  imageUrl,
  embedded = false
}) => {
  const [activeTab, setActiveTab] = useState<'mujer' | 'hombre'>('mujer');
  
  if (!embedded && !isOpen) return null;

  const sizes = activeTab === 'mujer' ? WOMEN_SIZES : MEN_SIZES;

  const content = (
    <>
      {!embedded && (
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Ruler className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X size={20} />
            </button>
          )}
        </div>
      )}

      <div className={embedded ? "" : "p-4 overflow-y-auto max-h-[calc(90vh-80px)]"}>
        {mode === 'image' && imageUrl ? (
          <div className="flex flex-col items-center">
            <img 
              src={imageUrl} 
              alt={title} 
              className="max-w-full h-auto rounded-lg shadow-sm"
            />
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab('mujer')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  activeTab === 'mujer' 
                    ? 'bg-pink-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Mujer
              </button>
              <button
                onClick={() => setActiveTab('hombre')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  activeTab === 'hombre' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Hombre
              </button>
            </div>

            <div className="mb-6 p-4 bg-blue-50 rounded-xl">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Info size={18} className="text-blue-600" />
                Cómo tomar las medidas
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex flex-col items-center text-center p-3 bg-white rounded-lg">
                  <div className="w-20 h-20 mb-2 bg-gray-100 rounded-full flex items-center justify-center text-3xl">
                    👕
                  </div>
                  <p className="font-medium">Pecho</p>
                  <p className="text-gray-600 text-xs">Medir la parte más ancha del pecho, por debajo de las axilas</p>
                </div>
                <div className="flex flex-col items-center text-center p-3 bg-white rounded-lg">
                  <div className="w-20 h-20 mb-2 bg-gray-100 rounded-full flex items-center justify-center text-3xl">
                    📏
                  </div>
                  <p className="font-medium">Cintura</p>
                  <p className="text-gray-600 text-xs">Medir a la altura del ombligo, sin apretar</p>
                </div>
                <div className="flex flex-col items-center text-center p-3 bg-white rounded-lg">
                  <div className="w-20 h-20 mb-2 bg-gray-100 rounded-full flex items-center justify-center text-3xl">
                    👖
                  </div>
                  <p className="font-medium">Cadera</p>
                  <p className="text-gray-600 text-xs">Medir la parte más ancha de la cadera</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-3 text-left font-semibold">Talle</th>
                    <th className="px-4 py-3 text-center font-semibold">Pecho (cm)</th>
                    <th className="px-4 py-3 text-center font-semibold">Cintura (cm)</th>
                    <th className="px-4 py-3 text-center font-semibold">Cadera (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {sizes.map((row, index) => (
                    <tr key={row.size} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 font-bold text-lg">{row.size}</td>
                      <td className="px-4 py-3 text-center">{row.pecho}</td>
                      <td className="px-4 py-3 text-center">{row.cintura}</td>
                      <td className="px-4 py-3 text-center">{row.cadera}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <h4 className="font-semibold text-yellow-800 mb-2">💡 Tips</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Si estás entre dos talles, elegí el más grande para mayor comodidad</li>
                <li>• Las medidas pueden variar ligeramente según el modelo de la prenda</li>
                <li>• Medíte con ropa interior o ajustada para mayor precisión</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </>
  );

  if (embedded) {
    return <div className="w-full">{content}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {content}
      </div>
    </div>
  );
};

export default SizeGuide;
