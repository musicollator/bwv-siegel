// bwv-siegel.js - Complete Self-Contained Web Component
// Bach Siegel Animation with Quantized Light-Refraction Physics

class AngleCalculator {
  constructor(quantization = 8) {
    this.quantization = Math.max(2, quantization);
  }

  setQuantization(newQ) {
    this.quantization = Math.max(2, newQ);
    return this.quantization;
  }

  getSetOfAllowedAngles(entryAngle, otherExitAngle = null) {
    const Q = this.quantization;
    const step = 360 / Q;
    const allowedAngles = [];

    // Correct edge calculations for 90° < angle < 270°
    const startQ = Math.floor(Q / 4) + 1;
    const endQ = Math.ceil(3 * Q / 4) - 1;

    for (let q = startQ; q <= endQ; q++) {
      const angle = (entryAngle + q * step) % 360;

      // If otherExitAngle is provided, exclude opposite direction
      if (otherExitAngle !== null) {
        const oppositeAngle = (otherExitAngle + 180) % 360;
        if (angle === oppositeAngle) {
          continue;
        }
      }
      
      allowedAngles.push(angle);
    }

    return allowedAngles;
  }

  getQuantizationRange() {
    const Q = this.quantization;
    const startQ = Math.floor(Q / 4) + 1;
    const endQ = Math.ceil(3 * Q / 4) - 1;
    return { startQ, endQ, step: 360 / Q };
  }
}

class BwvSiegel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Initialize properties
    this.quantization = parseInt(this.getAttribute('quantization')) || 8;
    this.radius = parseInt(this.getAttribute('radius')) || 120;
    this.autoStart = this.hasAttribute('auto-start');
    this.svgPath = this.getAttribute('svg-path') || 'assets/siegel.svg';
    this.templatePath = this.getAttribute('template-path') || 'bwv-siegel.html';
    this.stylesPath = this.getAttribute('styles-path') || 'bwv-siegel.css';
    
    // Animation state
    this.isRunning = false;
    this.currentAnimation = null;
    this.angleCalculator = new AngleCalculator(this.quantization);
    
    // Seal positions - Fixed starting positions
    this.leftSealFromAngle = 180;   // Left seal (blue JSB) from west
    this.rightSealFromAngle = 0;    // Right seal (gold BJS) from east
    this.leftSealToAngle = null;
    this.rightSealToAngle = null;
    
    // Loading state
    this.isLoaded = false;
    
    this.loadComponentFiles();
  }

  static get observedAttributes() {
    return ['quantization', 'radius', 'auto-start', 'svg-path', 'template-path', 'styles-path'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    switch (name) {
      case 'quantization':
        this.quantization = parseInt(newValue) || 8;
        this.angleCalculator.setQuantization(this.quantization);
        break;
      case 'radius':
        this.radius = parseInt(newValue) || 120;
        break;
      case 'auto-start':
        this.autoStart = this.hasAttribute('auto-start');
        break;
      case 'svg-path':
        this.svgPath = newValue || 'siegel.svg';
        this.updateSvgReferences();
        break;
    }
  }

  async loadComponentFiles() {
    try {
      // Show loading state
      this.shadowRoot.innerHTML = '<div style="padding: 20px; text-align: center;">🎼 Loading BWV Siegel...</div>';
      
      // Load HTML template and CSS styles in parallel
      const [htmlResponse, cssResponse] = await Promise.all([
        fetch(this.templatePath),
        fetch(this.stylesPath)
      ]);
      
      if (!htmlResponse.ok) {
        throw new Error(`Template not found: ${this.templatePath}`);
      }
      if (!cssResponse.ok) {
        throw new Error(`Styles not found: ${this.stylesPath}`);
      }
      
      const htmlTemplate = await htmlResponse.text();
      const cssStyles = await cssResponse.text();
      
      // Process template variables
      const processedHtml = this.processTemplate(htmlTemplate);
      const processedCss = this.processTemplate(cssStyles);
      
      // Render the component
      this.render(processedHtml, processedCss);
      this.initializeElements();
      this.checkSvgAvailability();
      
      this.isLoaded = true;
      
      if (this.autoStart) {
        // Start after a brief delay to ensure everything is loaded
        setTimeout(() => this.start(), 100);
      }
      
      console.log('BWV Siegel: Component loaded successfully');
      
    } catch (error) {
      console.error('BWV Siegel: Failed to load component files:', error);
      this.shadowRoot.innerHTML = `
        <div style="padding: 20px; color: red; font-family: Arial, sans-serif;">
          <h3>❌ BWV Siegel Load Error</h3>
          <p>${error.message}</p>
          <p>Make sure <code>${this.templatePath}</code> and <code>${this.stylesPath}</code> are available.</p>
        </div>
      `;
    }
  }

  processTemplate(template) {
    return template
      .replace(/\{\{SVG_PATH\}\}/g, this.svgPath)
      .replace(/\{\{QUANTIZATION\}\}/g, this.quantization)
      .replace(/\{\{RADIUS\}\}/g, this.radius);
  }

  render(htmlTemplate, cssStyles) {
    this.shadowRoot.innerHTML = `
      <style>${cssStyles}</style>
      ${htmlTemplate}
    `;
  }

  initializeElements() {
    this.leftSeal = this.shadowRoot.getElementById('left-seal');
    this.rightSeal = this.shadowRoot.getElementById('right-seal');
  }

  checkSvgAvailability() {
    // Check if SVG file is accessible
    fetch(this.svgPath, { method: 'HEAD' })
      .then(response => {
        if (!response.ok) {
          console.warn(`BWV Siegel: SVG file not found at '${this.svgPath}'. Seals may not display correctly.`);
        } else {
          console.log(`BWV Siegel: SVG loaded successfully from '${this.svgPath}'`);
        }
      })
      .catch(error => {
        console.warn(`BWV Siegel: Cannot access SVG file '${this.svgPath}':`, error.message);
      });
  }

  // Public API Methods
  start() {
    if (!this.isLoaded) {
      console.warn('BWV Siegel: Component not yet loaded. Please wait...');
      return;
    }
    
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Reset positions
    this.leftSealFromAngle = 180;
    this.rightSealFromAngle = 0;
    
    // Start animation loop
    this.animationStep();
    
    // Dispatch event
    this.dispatchEvent(new CustomEvent('siegel-started', {
      detail: { quantization: this.quantization }
    }));
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    // Hide seals
    if (this.leftSeal) this.leftSeal.classList.remove('active');
    if (this.rightSeal) this.rightSeal.classList.remove('active');
    
    // Dispatch event
    this.dispatchEvent(new CustomEvent('siegel-stopped'));
  }

  reset() {
    this.stop();
    this.leftSealFromAngle = 180;
    this.rightSealFromAngle = 0;
    this.leftSealToAngle = null;
    this.rightSealToAngle = null;
    
    // Dispatch event
    this.dispatchEvent(new CustomEvent('siegel-reset'));
  }

  setQuantization(newQ) {
    this.quantization = this.angleCalculator.setQuantization(newQ);
    this.setAttribute('quantization', this.quantization);
    
    // Dispatch event
    this.dispatchEvent(new CustomEvent('quantization-changed', {
      detail: { quantization: this.quantization }
    }));
  }

  // Animation Logic
  animationStep() {
    if (!this.isRunning) return;

    try {
      this.pickExitAngles();
      this.animateSeals();
    } catch (error) {
      console.error('Animation error:', error);
      this.stop();
    }
  }

  pickExitAngles() {
    // Calculate left seal exit angle
    const leftAllowed = this.angleCalculator.getSetOfAllowedAngles(this.leftSealFromAngle);
    if (leftAllowed.length === 0) {
      throw new Error("No valid left exit angles found!");
    }
    this.leftSealToAngle = leftAllowed[Math.floor(Math.random() * leftAllowed.length)];

    // Calculate right seal exit angle (exclude opposite of left)
    const rightAllowed = this.angleCalculator.getSetOfAllowedAngles(this.rightSealFromAngle, this.leftSealToAngle);
    if (rightAllowed.length === 0) {
      throw new Error("No valid right exit angles found!");
    }
    this.rightSealToAngle = rightAllowed[Math.floor(Math.random() * rightAllowed.length)];

    console.log(`🎭 BWV Siegel: Left ${this.leftSealFromAngle}°→${this.leftSealToAngle}°, Right ${this.rightSealFromAngle}°→${this.rightSealToAngle}°`);
  }

  animateSeals() {
    // Show seals
    this.leftSeal.classList.add('active');
    this.rightSeal.classList.add('active');

    // Set initial positions
    this.setSealPosition(this.leftSeal, this.leftSealFromAngle);
    this.setSealPosition(this.rightSeal, this.rightSealFromAngle);

    // Animate to center
    this.animateToCenter(() => {
      // Brief pause, then animate to exit
      setTimeout(() => {
        if (!this.isRunning) return;
        this.animateToExit(() => {
          if (!this.isRunning) return;
          
          // Set up next iteration with opposite re-entry
          this.leftSealFromAngle = (this.leftSealToAngle + 180) % 360;
          this.rightSealFromAngle = (this.rightSealToAngle + 180) % 360;
          
          // Continue loop
          setTimeout(() => this.animationStep(), 500);
        });
      }, 800);
    });
  }

  setSealPosition(seal, angle) {
    const container = this.shadowRoot.querySelector('.siegel-container');
    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const radian = (angle * Math.PI) / 180;
    const x = centerX + this.radius * Math.cos(radian);
    const y = centerY + this.radius * Math.sin(radian);
    
    seal.style.left = x + 'px';
    seal.style.top = y + 'px';
  }

  animateToCenter(callback) {
    const container = this.shadowRoot.querySelector('.siegel-container');
    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Simple CSS transition animation
    this.leftSeal.style.transition = 'left 0.8s ease-out, top 0.8s ease-out';
    this.rightSeal.style.transition = 'left 0.8s ease-out, top 0.8s ease-out';
    
    this.leftSeal.style.left = centerX + 'px';
    this.leftSeal.style.top = centerY + 'px';
    this.rightSeal.style.left = centerX + 'px';
    this.rightSeal.style.top = centerY + 'px';
    
    setTimeout(callback, 800);
  }

  animateToExit(callback) {
    this.leftSeal.style.transition = 'left 0.8s ease-in, top 0.8s ease-in';
    this.rightSeal.style.transition = 'left 0.8s ease-in, top 0.8s ease-in';
    
    this.setSealPosition(this.leftSeal, this.leftSealToAngle);
    this.setSealPosition(this.rightSeal, this.rightSealToAngle);
    
    setTimeout(callback, 800);
  }

  // Helper Methods
  updateSvgReferences() {
    const leftUse = this.shadowRoot.getElementById('left-seal-use');
    const rightUse = this.shadowRoot.getElementById('right-seal-use');
    
    if (leftUse) {
      leftUse.setAttribute('href', `${this.svgPath}#bach_siel_full_left-symbol`);
    }
    if (rightUse) {
      rightUse.setAttribute('href', `${this.svgPath}#bach_siel_full_right-symbol`);
    }
  }

  // Getters for external access
  get status() {
    return {
      isRunning: this.isRunning,
      quantization: this.quantization,
      leftSeal: { from: this.leftSealFromAngle, to: this.leftSealToAngle },
      rightSeal: { from: this.rightSealFromAngle, to: this.rightSealToAngle }
    };
  }
}

// Register the Web Component
customElements.define('bwv-siegel', BwvSiegel);

// Export for module usage
export default BwvSiegel;