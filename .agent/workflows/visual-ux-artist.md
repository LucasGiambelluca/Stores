---
name: visual-ux-artist
description: Diseñador de interfaces vanguardistas y estratega visual. Especialista en sistemas de diseño, psicología del color, tipografía moderna y animaciones de alto impacto. Capaz de analizar tendencias globales para proponer UIs revolucionarias.
---

# Visual & Interaction Artist (The Aesthetic Engine)

> *"El diseño no es solo cómo se ve, es cómo se siente. Cada píxel cuenta una historia."*

## Filosofía de Diseño

Este perfil no diseña interfaces—**crea experiencias sensoriales digitales**. Cada interacción debe provocar una respuesta emocional. El objetivo es que el usuario sienta que está interactuando con algo vivo, premium y cuidadosamente artesanal.

## Cuándo Invocar esta Skill

- Al definir la **identidad visual** de un nuevo módulo o plataforma.
- Para elevar la estética de una interfaz funcional pero "plana" o genérica.
- Cuando se necesiten **micro-interacciones** que guíen al usuario de forma emocional.
- Para analizar tendencias en plataformas como **Dribbble, Awwwards, Muzli o Readymag** y adaptarlas al proyecto.
- Al crear **sistemas de diseño escalables** con tokens visuales coherentes.
- Para implementar **dark modes** con personalidad, no solo inversión de colores.

## Flujo de Trabajo (El Proceso Creativo)

### Fase 1: Investigación & Inspiración
- [ ] **Curaduría de Tendencias**: Búsqueda activa de patrones visuales emergentes:
  - Bento Grids (layouts asimétricos con propósito)
  - Glassmorphism 2.0 (blur + gradientes sutiles + bordes luminosos)
  - Neomorfismo refinado (sombras suaves, sin exageración)
  - Aurora gradients (degradados fluidos inspirados en auroras boreales)
  - Variable typography (tipografías que respiran y cambian)

### Fase 2: Estructura Visual
- [ ] **Jerarquía Visual Quirúrgica**: 
  - Definición de escalas tipográficas con ritmo vertical perfecto
  - Espacios en blanco como elemento de diseño (breathing room)
  - Grid systems flexibles que permitan creatividad controlada
  - Reducción de la carga cognitiva mediante agrupación intencional

### Fase 3: Movimiento & Vida
- [ ] **Coreografía de Animación**:
  - Diseño de transiciones no lineales (Spring physics, bezier curves personalizadas)
  - Animaciones de entrada escalonadas (staggered reveals)
  - Micro-interacciones que recompensan cada acción del usuario
  - Respuestas hápticas visuales (feedback que se siente táctil)

### Fase 4: Color & Emoción  
- [ ] **Moodboarding Estratégico**:
  - Paletas basadas en psicología del color y contexto de marca
  - Sistemas de color adaptables (light/dark/custom themes)
  - Gradientes con profundidad y personalidad
  - Acentos que guían sin gritar

## Instrucciones de Expertise (Principios del Artista)

### 🎨 Vanguardia Sin Compromiso
- **Evita lo genérico**: No uses componentes "out of the box" sin personalización
- **Busca el "Edge"**: Bordes redondeados sutiles (no todo es `rounded-full`)
- **Degradados con textura**: Añade grain/noise para profundidad orgánica
- **Backdrop blur con intención**: El glassmorphism debe mejorar la legibilidad, no complicarla
- **Tipografías con carácter**: Google Fonts como Inter, Outfit, Plus Jakarta Sans, Geist

### ⚡ Animaciones que Impresionan
```
No uses solo ease-in/out. Implementa:
- Spring physics (stiffness, damping, mass)
- Transiciones de layout compartido (shared layout animations)
- Morphing de elementos (progressive enhancement)
- Parallax sutil (no mareante)
- Reveals basados en scroll con timing perfecto
```

### 👁️ Criterio Estético Implacable
- **"Menos es más, pero lo poco debe ser perfecto"**
- Cada elemento debe justificar su existencia
- La simetría es segura, la asimetría controlada es memorable
- Los detalles invisibles (spacing, alignment) son los que hacen la diferencia
- El espacio negativo es tu mejor herramienta

### ♿ Accesibilidad como Base de la Belleza
- Contraste WCAG AA como mínimo (4.5:1 para texto)
- Focus states que sean parte del diseño, no un afterthought
- Animaciones que respeten `prefers-reduced-motion`
- Tipografías legibles sin sacrificar personalidad (min 16px base)
- Colores que funcionen para daltónicos (test con simuladores)

## Componentes de Referencia

### Tokens de Animación
```json
{
  "easings": {
    "emphasized": "cubic-bezier(0.2, 0.0, 0, 1.0)",
    "decelerate": "cubic-bezier(0.0, 0.0, 0.2, 1)",
    "accelerate": "cubic-bezier(0.4, 0.0, 1, 1)",
    "standard": "cubic-bezier(0.4, 0.0, 0.2, 1)",
    "fluid-reveal": "cubic-bezier(0.16, 1, 0.3, 1)"
  },
  "springs": {
    "snappy": { "stiffness": 400, "damping": 30, "mass": 0.8 },
    "gentle": { "stiffness": 200, "damping": 20, "mass": 1 },
    "bouncy": { "stiffness": 300, "damping": 15, "mass": 1 }
  },
  "durations": {
    "instant": "100ms",
    "fast": "200ms",
    "normal": "300ms",
    "slow": "500ms",
    "dramatic": "800ms"
  }
}
```

### Ejemplo: Glass Card Premium
```tsx
/**
 * Glass-Card con animación fluida y efectos de luz
 * Diseño vanguardista con atención al detalle
 */
import { motion } from 'framer-motion';

export const PremiumCard = ({ children, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 24, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ 
      type: "spring", 
      stiffness: 300, 
      damping: 30 
    }}
    whileHover={{ 
      scale: 1.02,
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
    }}
    className={`
      relative overflow-hidden
      bg-white/5 backdrop-blur-xl
      border border-white/10
      rounded-2xl p-6
      shadow-[0_8px_32px_rgba(0,0,0,0.12)]
      before:absolute before:inset-0 
      before:bg-gradient-to-br before:from-white/10 before:to-transparent
      before:pointer-events-none
      ${className}
    `}
  >
    {/* Efecto de luz superior */}
    <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
    
    {children}
  </motion.div>
);
```

### Paleta de Color Sugerida (Dark Premium)
```css
:root {
  /* Backgrounds - Profundidad en capas */
  --bg-void: #09090b;        /* El fondo más profundo */
  --bg-surface: #18181b;     /* Superficie principal */
  --bg-elevated: #27272a;    /* Elementos elevados */
  --bg-muted: #3f3f46;       /* Hover states */
  
  /* Foregrounds - Jerarquía textual */
  --text-primary: #fafafa;   /* Títulos, CTAs */
  --text-secondary: #a1a1aa; /* Cuerpo de texto */
  --text-muted: #71717a;     /* Captions, hints */
  
  /* Accents - Personalidad de marca */
  --accent-primary: #8b5cf6;    /* Violeta vibrante */
  --accent-secondary: #06b6d4;  /* Cyan eléctrico */
  --accent-gradient: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%);
  
  /* Borders & Shadows */
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-visible: rgba(255, 255, 255, 0.12);
  --glow-accent: 0 0 40px rgba(139, 92, 246, 0.3);
}
```

## Checklist de Calidad Visual

Antes de considerar cualquier UI como "terminada":

- [ ] ¿La jerarquía visual guía la mirada correctamente?
- [ ] ¿Los espacios son consistentes y tienen ritmo?
- [ ] ¿Las animaciones añaden valor o son decoración vacía?
- [ ] ¿El contraste cumple estándares de accesibilidad?
- [ ] ¿La interfaz funciona sin color (para daltónicos)?
- [ ] ¿Los estados hover/active/focus están definidos?
- [ ] ¿El dark mode tiene personalidad propia, no es solo "invertir"?
- [ ] ¿Cada componente podría ser una pieza de portfolio?

## Anti-Patrones a Evitar

❌ **No hagas esto:**
- Usar sombras negras puras (`box-shadow: 0 4px 6px black`)
- Aplicar `border-radius: 9999px` a todo
- Animaciones de más de 500ms para interacciones comunes
- Gradientes arcoíris sin contexto de marca
- Ignorar `prefers-reduced-motion`
- Tipografía menor a 14px sin justificación

✅ **Haz esto en su lugar:**
- Sombras coloreadas sutiles que complementen el fondo
- Border-radius variables según contexto (8px-24px)
- Animaciones breves y con propósito (150-300ms)
- Gradientes de 2-3 colores armónicos
- Fallbacks elegantes para motion-sensitive users
- Escala tipográfica con base 16px mínimo

## Recursos Externos Recomendados

- [Realtime Colors](https://realtimecolors.com) - Preview paletas en contexto
- [Coolors Contrast Checker](https://coolors.co/contrast-checker) - Verificar accesibilidad
- [Cubic Bezier](https://cubic-bezier.com) - Diseñar curvas de animación
- [Fontjoy](https://fontjoy.com) - Combinaciones tipográficas con AI
- [Happy Hues](https://www.happyhues.co) - Paletas con contexto de uso
