# 🎭 BWV Siegel

**Bach Siegel Animation Web Component with Quantized Light-Refraction Physics**

A self-contained Web Component that creates beautiful Bach Siegel seal animations following light-refraction physics principles with customizable quantization levels.

## ✨ Features

- **🎯 Pure Web Component** - Works with any framework or vanilla HTML
- **🎪 Self-contained** - Single file with embedded SVG, CSS, and JavaScript
- **⚙️ Configurable** - Adjustable quantization levels and physics parameters
- **🎨 Beautiful** - High-quality SVG animations with blue (JSB) and gold (BJS) seals
- **📱 Responsive** - Works on desktop and mobile devices
- **🔧 Framework Agnostic** - React, Vue, Angular, Svelte, or vanilla JavaScript

## 🚀 Quick Start

### CDN Usage (Easiest)

```html
<!DOCTYPE html>
<html>
<head>
    <title>BWV Siegel Demo</title>
</head>
<body>
    <!-- Just drop it in! -->
    <bwv-siegel quantization="8" auto-start></bwv-siegel>
    
    <!-- Load the component -->
    <script type="module" src="https://unpkg.com/bwv-siegel/bwv-siegel.js"></script>
</body>
</html>
```

### NPM Installation

```bash
npm install bwv-siegel
```

```javascript
// Import the component
import 'bwv-siegel';

// Use in your HTML
// <bwv-siegel quantization="12"></bwv-siegel>
```

### Local Development

```bash
# Clone and serve
git clone https://github.com/yourusername/bwv-siegel.git
cd bwv-siegel
python -m http.server 8080
# Open http://localhost:8080/demo.html
```

## 📖 Usage

### Basic HTML

```html
<!-- Simple usage -->
<bwv-siegel></bwv-siegel>

<!-- With configuration -->
<bwv-siegel 
    quantization="12" 
    radius="150" 
    auto-start>
</bwv-siegel>
```

### JavaScript API

```javascript
const siegel = document.querySelector('bwv-siegel');

// Control methods
siegel.start();           // Start animation
siegel.stop();            // Stop animation  
siegel.reset();           // Reset to initial state
siegel.setQuantization(16); // Change quantization level

// Get status
console.log(siegel.status);
// { isRunning: true, quantization: 8, leftSeal: {...}, rightSeal: {...} }
```

### Event Handling

```javascript
const siegel = document.querySelector('bwv-siegel');

// Listen to events
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
import 'bwv-siegel';

function SiegelComponent({ quantization = 8 }) {
    const siegelRef = useRef();
    
    useEffect(() => {
        const siegel = siegelRef.current;
        
        const handleStart = (e) => {
            console.log('Started!', e.detail);
        };
        
        siegel.addEventListener('siegel-started', handleStart);
        return () => siegel.removeEventListener('siegel-started', handleStart);
    }, []);
    
    return (
        <bwv-siegel 
            ref={siegelRef}
            quantization={quantization}
            auto-start
        />
    );
}
```

### Vue 3

```vue
<template>
    <bwv-siegel 
        :quantization="quantization"
        @siegel-started="onStarted"
        @quantization-changed="onQuantizationChanged"
    />
</template>

<script>
import 'bwv-siegel';

export default {
    data() {
        return {
            quantization: 8
        };
    },
    methods: {
        onStarted(event) {
            console.log('Started with Q=', event.detail.quantization);
        },
        onQuantizationChanged(event) {
            this.quantization = event.detail.quantization;
        }
    }
};
</script>
```

### Angular

```typescript
// app.component.ts
import { Component, ElementRef, ViewChild } from '@angular/core';
import 'bwv-siegel';

@Component({
    selector: 'app-root',
    template: `
        <bwv-siegel 
            #siegel
            [attr.quantization]="quantization"
            (siegel-started)="onStarted($event)">
        </bwv-siegel>
    `
})
export class AppComponent {
    @ViewChild('siegel') siegelElement!: ElementRef;
    quantization = 8;
    
    onStarted(event: any) {
        console.log('Started!', event.detail);
    }
}
```

## ⚙️ Configuration

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `quantization` | number | `8` | Number of discrete angle steps (2-24) |
| `radius` | number | `120` | Animation radius in pixels |
| `auto-start` | boolean | `false` | Start animation automatically |

### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `start()` | - | Start the animation |
| `stop()` | - | Stop the animation |
| `reset()` | - | Reset to initial state |
| `setQuantization(q)` | number | Change quantization level |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `status` | object | Current animation state |

### Events

| Event | Detail | Description |
|-------|--------|-------------|
| `siegel-started` | `{ quantization }` | Animation started |
| `siegel-stopped` | - | Animation stopped |
| `siegel-reset` | - | Animation reset |
| `quantization-changed` | `{ quantization }` | Quantization level changed |

## 🧮 Physics

The animation follows **light-refraction physics** principles:

1. **Quantized Angles**: Movement is restricted to discrete angles based on quantization level
2. **Refraction Rule**: Exit angles must satisfy `90° < angle < 270°` relative to entry
3. **Anti-collision**: Seals cannot exit in opposite directions (except special cases)
4. **Opposite Re-entry**: Each seal re-enters from the opposite side of its exit

**Example with Q=6:**
- Possible angles: `[0°, 60°, 120°, 180°, 240°, 300°]`
- Valid exits for seal entering from 180°: `[300°, 0°, 60°]` (refraction rule)
- If left seal exits at 0°, right seal cannot exit at 180° (anti-collision)

## 🧪 Testing

```bash
# Run unit tests
npm test

# Test specific quantization
node test/angle-calculator.test.js
```

## 🎨 Customization

The component uses CSS custom properties for styling:

```css
bwv-siegel {
    --siegel-radius: 150px;
    width: 500px;
    height: 500px;
}
```

## 🌟 Examples

Check out `demo.html` for comprehensive examples including:
- Basic usage
- External API control  
- Multiple instances
- Framework integration
- Event handling

## 📦 Browser Support

- ✅ Chrome 54+
- ✅ Firefox 63+
- ✅ Safari 10.1+
- ✅ Edge 79+

Requires ES6 modules and Web Components support.

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

Inspired by Bach's mathematical precision and the beauty of light refraction in physics. The Siegel seals dance according to quantized physics rules, creating mesmerizing patterns that combine art, mathematics, and science.

---

**Made with ❤️ and ⚡ by the BWV Siegel Team**