# 🎭 BWV Siegel

**Bach Siegel Animation Web Component with Quantized Movement Patterns**

A modular Web Component that creates beautiful Bach Siegel seal animations with customizable quantization levels and mathematical movement patterns.

> **📋 Requirements**: This component requires external files available in the `exports/` directory:
> - `bwv-siegel.html` - Component template
> - `bwv-siegel.css` - Component styles  
> - `bwv-siegel.svg` - SVG symbols
> - `AngleCalculator.js` - Movement logic
>
> All files are loaded dynamically and follow proper separation of concerns.

## ✨ Features

- **🎯 Clean & Focused** - Pure animation component without built-in controls  
- **🏗️ Modular Architecture** - Separation of logic (JS), template (HTML), styles (CSS), and assets (SVG)
- **🎪 External File Loading** - No embedded content, all files loaded dynamically
- **⚙️ API Controlled** - Programmatic control via methods and events
- **🎨 Beautiful** - High-quality SVG animations with blue (JSB) and gold (BJS) seals
- **📱 Responsive** - Works on desktop and mobile devices
- **🔧 Framework Agnostic** - React, Vue, Angular, Svelte, or vanilla JavaScript

## 🚀 Quick Start

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
    <title>BWV Siegel Demo</title>
</head>
<body>
    <!-- Simple usage with auto-start -->
    <bwv-siegel quantization="8" auto-start></bwv-siegel>
    
    <!-- Load the component from exports directory -->
    <script type="module" src="exports/bwv-siegel.js"></script>
</body>
</html>
```

### NPM Installation

```bash
npm install bwv-siegel
```

**Copy Required Files:**
```bash
# Copy all component files to your public directory
cp -r node_modules/bwv-siegel/exports/* ./public/
```

```javascript
// Import and use in your application
import './public/bwv-siegel.js';

// Use in your HTML
// <bwv-siegel quantization="12" auto-start></bwv-siegel>
```

### Local Development

```bash
# Clone and serve
git clone https://github.com/yourusername/bwv-siegel.git
cd bwv-siegel
python -m http.server 8080
# Open http://localhost:8080/index.html or http://localhost:8080/demo.html
```

## 📁 Project Structure

```
bwv-siegel/
├── LICENSE                      # MIT License
├── README.md                    # Documentation  
├── index.html                   # Simple example page
├── demo.html                    # Comprehensive examples
├── package.json                 # NPM configuration
├── exports/                     # Component files (all in one directory)
│   ├── AngleCalculator.js       # Movement calculation logic
│   ├── bwv-siegel.js           # Main component logic
│   ├── bwv-siegel.html         # Component template
│   ├── bwv-siegel.css          # Component styles
│   └── bwv-siegel.svg          # SVG symbols and graphics
└── test/
    ├── angle-calculator.test.js # Unit tests
    └── angle-calculator-enhanced.test.js
```

**🎯 Proper Separation of Concerns:**
- **Core Logic** (`AngleCalculator.js`) - Testable movement calculations
- **Component** (`bwv-siegel.js`) - Web Component wrapper
- **Template** (`bwv-siegel.html`) - Minimal HTML structure
- **Styles** (`bwv-siegel.css`) - CSS styling and animations
- **Assets** (`bwv-siegel.svg`) - Vector graphics and symbols

All files are organized in the `exports/` directory for easy deployment.

## 🎨 Design Philosophy

The BWV Siegel component follows a **clean, focused design**:

- **No built-in controls** - The component focuses purely on animation
- **API-driven** - Control via JavaScript methods: `start()`, `stop()`, `setQuantization()`  
- **Event-based** - Listen to `siegel-started`, `siegel-stopped`, etc.
- **Composable** - You build the UI controls that fit your app's design
- **Separation of concerns** - Animation logic is separate from UI controls

**Why no built-in controls?**
- Different apps need different control styles
- Controls would impose design opinions on your app
- Cleaner component API and smaller file size
- More reusable across different use cases

## 📖 Usage

### Basic HTML

```html
<!-- Clean component - just the animation -->
<bwv-siegel quantization="8" auto-start></bwv-siegel>

<!-- With configuration -->
<bwv-siegel 
    quantization="12" 
    freeze-duration="1000"
    template-path="custom/template.html"
    styles-path="custom/styles.css"
    svg-path="custom/siegel.svg">
</bwv-siegel>

<!-- Control via JavaScript API -->
<script>
  const siegel = document.querySelector('bwv-siegel');
  siegel.start();
  siegel.setQuantization(16);
</script>
```

### JavaScript API

```javascript
const siegel = document.querySelector('bwv-siegel');

// Control methods
siegel.start();                 // Start animation
siegel.stop();                  // Stop animation  
siegel.reset();                 // Reset to initial state
siegel.setQuantization(16);     // Change quantization level
siegel.setFreezeDuration(1200); // Set pause duration at point C

// Get status
console.log(siegel.status);
// { 
//   isRunning: true, 
//   quantization: 8, 
//   frozenAtC: false,
//   blueJSB: { currentAzimuth: 90, angularDistance: 1.2 },
//   goldBJS: { currentAzimuth: 270, angularDistance: 1.2 }
// }
```

### Event Handling

```javascript
const siegel = document.querySelector('bwv-siegel');

// Listen to events (if implemented)
siegel.addEventListener('siegel-started', (e) => {
    console.log('Animation started with Q=', e.detail.quantization);
});

siegel.addEventListener('siegel-stopped', () => {
    console.log('Animation stopped');
});

siegel.addEventListener('quantization-changed', (e) => {
    console.log('Quantization changed to', e.detail.quantization);
});
```

## 🔧 Framework Integration

### React

```jsx
import { useRef, useEffect } from 'react';
import './exports/bwv-siegel.js';

function SiegelComponent({ quantization = 8 }) {
    const siegelRef = useRef();
    
    useEffect(() => {
        const siegel = siegelRef.current;
        if (!siegel) return;
        
        siegel.setQuantization(quantization);
    }, [quantization]);
    
    return (
        <div style={{ width: '400px', height: '400px' }}>
            <bwv-siegel 
                ref={siegelRef}
                quantization={quantization}
                auto-start
            />
        </div>
    );
}
```

### Vue 3

```vue
<template>
    <div class="siegel-container">
        <bwv-siegel 
            :quantization="quantization"
            auto-start
        />
    </div>
</template>

<script>
import '../exports/bwv-siegel.js';

export default {
    data() {
        return {
            quantization: 8
        };
    }
};
</script>

<style>
.siegel-container {
    width: 400px;
    height: 400px;
}
</style>
```

### Angular

```typescript
// app.component.ts
import { Component, ElementRef, ViewChild } from '@angular/core';
import '../exports/bwv-siegel.js';

@Component({
    selector: 'app-root',
    template: `
        <div class="siegel-container">
            <bwv-siegel 
                #siegel
                [attr.quantization]="quantization"
                auto-start>
            </bwv-siegel>
        </div>
    `,
    styles: [`
        .siegel-container {
            width: 400px;
            height: 400px;
        }
    `]
})
export class AppComponent {
    @ViewChild('siegel') siegelElement!: ElementRef;
    quantization = 8;
}
```

## ⚙️ Configuration

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `quantization` | number | `8` | Number of discrete angle steps (2-24) |
| `freeze-duration` | number | `800` | Pause duration at point C in milliseconds |
| `template-path` | string | `"bwv-siegel.html"` | Path to the HTML template file |
| `styles-path` | string | `"bwv-siegel.css"` | Path to the CSS styles file |
| `svg-path` | string | `"bwv-siegel.svg"` | Path to the SVG file |
| `auto-start` | boolean | `false` | Start animation automatically |

### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `start()` | - | Start the animation |
| `stop()` | - | Stop the animation |
| `reset()` | - | Reset to initial state |
| `setQuantization(q)` | number | Change quantization level |
| `setFreezeDuration(ms)` | number | Set pause duration in milliseconds |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `status` | object | Current animation state and seal positions |

## 🧮 Movement Patterns

The animation follows mathematical movement rules:

1. **Quantized Angles**: Movement is restricted to discrete angles based on quantization level
2. **Forward Movement**: Seals prefer forward directions within a specific angular range
3. **Directional Logic**: Each seal selects new directions based on probability distributions
4. **Synchronized Motion**: Both seals move together along their geodesic paths

**Example with Q=8:**
- Possible angles: `[0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°]`
- Seals travel along curved paths on a virtual sphere
- Direction changes occur when seals return to the center point
- Probability weighting favors smooth transitions and separation

## 🧪 Testing

```bash
# Run unit tests
npm test

# Test specific functionality
node test/angle-calculator.test.js
```

## 🎨 Customization

The component loads external CSS that can be customized:

```css
/* In your custom bwv-siegel.css */
:host {
    --siegel-radius: 150px;
}

.seal {
    width: 100px;
    height: 100px;
}

.siegel-container {
    background: your-custom-background;
}
```

## 🌟 Examples

Check out the demo files for comprehensive examples:

- **`index.html`** - Clean, minimal example with elegant styling
- **`demo.html`** - Full feature demonstrations including:
  - External API control examples
  - Multiple instances with different containers
  - Framework integration patterns
  - Custom clipping and styling

## 📦 Browser Support

- ✅ Chrome 54+ (ES6 modules, Web Components)
- ✅ Firefox 63+ (ES6 modules, Web Components)
- ✅ Safari 10.1+ (ES6 modules, Web Components)
- ✅ Edge 79+ (ES6 modules, Web Components)

Requires modern browser with ES6 modules and Web Components support.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`npm test`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🎼 About

Inspired by Bach's mathematical precision and geometric beauty. The Siegel seals dance according to quantized movement rules, creating mesmerizing patterns that combine art, mathematics, and elegant animation.

---

**Made with ❤️ and ⚡ by Christophe Thiebaud and Claude.ai**