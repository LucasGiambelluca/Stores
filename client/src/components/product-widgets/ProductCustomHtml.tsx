
import React, { useEffect, useRef } from 'react';

interface ProductCustomHtmlProps {
  html?: string;
}

const ProductCustomHtml: React.FC<ProductCustomHtmlProps> = ({ html }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Execute scripts in the HTML if any
    if (containerRef.current && html) {
      const scripts = containerRef.current.getElementsByTagName('script');
      Array.from(scripts).forEach((script) => {
        const newScript = document.createElement('script');
        Array.from(script.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.appendChild(document.createTextNode(script.innerHTML));
        script.parentNode?.replaceChild(newScript, script);
      });
    }
  }, [html]);

  if (!html) return null;

  return (
    <div className="py-4">
      <div 
        ref={containerRef}
        className="max-w-4xl mx-auto px-4"
        dangerouslySetInnerHTML={{ __html: html }} 
      />
    </div>
  );
};

export default ProductCustomHtml;
