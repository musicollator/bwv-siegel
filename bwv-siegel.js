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
    
    // Animation state
    this.isRunning = false;
    this.currentAnimation = null;
    this.angleCalculator = new AngleCalculator(this.quantization);
    
    // Seal positions - Fixed starting positions
    this.leftSealFromAngle = 180;   // Left seal (blue JSB) from west
    this.rightSealFromAngle = 0;    // Right seal (gold BJS) from east
    this.leftSealToAngle = null;
    this.rightSealToAngle = null;
    
    this.render();
    this.initializeElements();
    
    if (this.autoStart) {
      // Start after a brief delay to ensure everything is loaded
      setTimeout(() => this.start(), 100);
    }
  }

  static get observedAttributes() {
    return ['quantization', 'radius', 'auto-start'];
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
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 400px;
          position: relative;
          --siegel-radius: ${this.radius}px;
        }

        .siegel-container {
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
          background: white;
        }

        .seal {
          position: absolute;
          width: 120px;
          height: 120px;
          display: none;
          transform: translate(-50%, -50%);
          transition: none;
        }

        .seal.active {
          display: block;
        }

        .seal svg {
          width: 100%;
          height: 100%;
        }

        .controls {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(0, 0, 0, 0.8);
          padding: 10px;
          border-radius: 5px;
          color: white;
          font-family: Arial, sans-serif;
          font-size: 12px;
          z-index: 1000;
        }

        .controls button {
          display: block;
          width: 100%;
          margin: 2px 0;
          padding: 4px 8px;
          background: #d4af37;
          color: #000;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          font-size: 11px;
        }

        .controls button:hover {
          background: #b8941f;
        }

        .controls button:disabled {
          background: #666;
          cursor: not-allowed;
        }

        .quantization-control {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #444;
        }

        .quantization-control input {
          width: 40px;
          padding: 2px;
          margin: 0 5px;
        }

        .status {
          position: absolute;
          bottom: 10px;
          left: 10px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 5px 10px;
          border-radius: 3px;
          font-family: monospace;
          font-size: 10px;
          z-index: 1000;
        }
      </style>

      <div class="siegel-container">
        <!-- Left Seal (Blue JSB) -->
        <div class="seal" id="left-seal">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <path fill="#1E3A8A" d="M56.03 8.592c.518-3.53 4.943-3.56 3.058.404.625 7.064 8.027 10.545 13.806 12.982 2.3 1.11 7.473 1.571 2.666 3.211-12.916 8.786-19.648 23.843-31.735 33.574-7.926 6.831-19.556 10.883-29.69 6.889-5.26-2.224-8.29-8.206-7.424-13.776-3.237-.956-6.271-10.06-1.499-8.298.642 2.294 2.028 7.086 3.238 2.442 2.408 4.134-.735 10.488 3.184 14.57 6.47 6.107 16.932 3.824 23.192-1.47 8.133-6.523 13.326-15.89 21.248-22.666 4.314-4.685 12.216-9.293 15.5-12.528-9.595-2.637-17.311-9.752-27.037-11.922-8.835-1.367-18.275 5.702-18.315 14.918-2.446 5.39 7.548 3.875 3.923 9.602-5.013 3.55-6.956-2.771-5.668-6.497-.71-6.233 1.26-13.029 6.149-17.17-2.719.706-9.94-.426-4.428-3.27 5.455 1.09 10.881.014 16.243-1.228 5.213-.027 10.253 1.868 14.699 4.478-.275-1.443-1.414-2.698-1.11-4.245z"/>
            <path fill="#1E3A8A" d="M108.102 24.148c2.022-4.029 13.413-.828 5.87 1.317-2.576.162-4.729-.01-1.663 2.019 5.572 5.178 7.5 15.506 1.143 20.822-4.498 4.02-11.439-1.152-9.624-6.578.593-6.409 12.089-3.485 6.382 1.612-3.153 1.918-6.052-4.43-5.082 1.458 2.111 6.622 10.904 2.19 10.316-3.514 1.5-9.101-7.31-17.42-16.27-16.109-7.769.385-11.946 7.626-15.894 13.281-9.902 14.434-16.89 31.779-31.976 41.857-9.636 6.88-23.867 7.26-33.559.331-2.91-3.383-4.647-6.753-9.314-7.779-3.52-3.807 3.311-3.938 4.753-.914-.617-2.071-.386-7.9 1.603-3.943-.76 7.089 5.032 13.39 11.941 14.204 10.73 2.07 20.152-5.137 27.386-12.11 11.801-11.299 17.571-27.157 28.473-39.145 6.348-6.812 16.575-10.489 25.515-6.81z"/>
            <path fill="#F8F8FF" d="M81.972 35.07c1.538-2.17 6.342-7.107 2.618-1.922-7.467 11.343-14.134 23.267-22.513 33.973C56 74.214 48.554 80.99 39.208 83.163 53.981 76.67 64.061 63.172 71.995 49.63c3.137-4.979 6.373-9.905 9.977-14.56z"/>
            <path fill="#F8F8FF" d="M58.44 37.622c1.493-1.585 8.937-8.972 4.904-3.982-8.693 10.728-17.98 21.336-29.488 29.106-3.538 1.273 3.831-3.176 4.883-4.81 6.864-6.478 13.138-13.54 19.701-20.314z"/>
          </svg>
        </div>

        <!-- Right Seal (Gold BJS) -->
        <div class="seal" id="right-seal">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <path fill="#D4AF37" d="M67.127 7.355c.4-.934.945-2.068 2.07-2.243.716-.19 1.188.557 1.31 1.157.17 1.357-.29 2.677-.607 3.977 4.356-1.196 9.057-1.515 13.44-.28 3.323 1.165 6.642 2.68 10.225 2.726 1.365.057 2.487-1.124 3.857-.838.96.812.308 2.449-.697 2.943-1.835.889-3.936.749-5.908 1.008 2.78 5.007 3.526 11.458.656 16.595 1.29 2.501-.637 6.135-3.582 5.966-1.834.09-3.582-1.714-3-3.57.385-2.34 2.999-3.411 5.141-3.154 3.492-6.083.629-14.554-5.452-17.779-3.526-1.832-7.736-1.745-11.469-.63-6.83 1.988-13.151 5.328-19.591 8.285-2.11.939-4.197 1.977-6.451 2.524 5.319 3.09 10.025 7.116 14.595 11.205C68.618 41.602 75.05 48.51 81.13 55.703c1.533 1.755 2.894 3.696 4.754 5.136 3.188 2.66 7.332 4.28 11.514 4.049 3.914-.218 7.66-2.175 10.163-5.176 2.637-3.136 3.665-7.535 2.756-11.523.353-.45.713-.893 1.087-1.33.607.998 1.019 2.102 1.081 3.278a6.028 6.028 0 0 0 2.07-2.083c.505-.854 1.506-1.714 2.55-1.195.79.794.655 2.199.062 3.074-1.211 1.36-2.945 2.096-4.632 2.675-.083 5.195-3.542 9.837-8.023 12.221-7.054 3.678-16.007 2.902-22.666-1.295-4.829-3.183-8.958-7.302-12.706-11.679-8.844-10.284-18.281-20.13-28.995-28.494 5.917.177 11.586-2.19 16.459-5.382 4.213-2.66 8.757-5.726 10.524-10.624zm0 0"/>
            <path fill="#D4AF37" d="M6.38 19.656c.962-.755 2.357-.65 3.428-.187a11.333 11.333 0 0 1 4.435 3.605c5.83-.772 11.808.986 16.592 4.328 4.42 3.059 7.84 7.339 10.568 11.928 7.086 11.075 15.15 21.625 24.743 30.656 4.436 4.121 9.228 7.917 14.572 10.799 3.679 1.927 7.613 3.59 11.777 4.029 5.23.013 10.367-3.54 12.125-8.481.902-3.346.764-6.885.382-10.298a135.4 135.4 0 0 1 1.911-1.027c.518 3.291.468 6.635.076 9.937 1.779-1.232 3.288-2.855 5.218-3.86.902-.455 2.385-.827 2.949.307.6 1.546-.677 3.167-2.05 3.782-2.314.908-4.69 1.66-6.986 2.616-2.088 4.347-6.111 7.777-10.83 8.899-4.82 1.198-9.886.26-14.46-1.449-10.347-3.971-19.55-10.648-26.96-18.847-2.861-3.136-5.476-6.484-8.094-9.821-3.382-4.842-6.146-10.08-9.392-15.011-3.154-4.841-6.557-9.657-11.1-13.302-2.796-2.212-6.482-3.856-10.09-2.923-3.335.873-6.146 3.202-8.112 5.98C5.104 34.132 4.006 37.792 5 41.182c.79 2.987 3.296 5.54 6.381 6.08 1.814.364 3.943-.23 4.988-1.838.715-1.01.82-2.286.829-3.485-.921 1.034-2.26 1.864-3.696 1.48-2.252-.509-2.773-3.694-1.312-5.258 1.283-1.513 3.997-1.4 5.078.302 1.738 2.583 1.474 6.409-.65 8.699-1.88 1.946-4.927 2.014-7.346 1.187-2.598-.85-4.614-2.981-5.698-5.446-1.413-3.158-1.717-6.918-.334-10.14 1.528-3.654 4.671-6.417 8.139-8.2-1.66-.55-3.444-1.069-4.718-2.33-.654-.64-1.1-1.9-.282-2.577zm0 0"/>
            <path fill="#F8F8FF" d="M45.673 25.29c5.725 3.314 10.769 7.684 15.64 12.129 4.753 4.67 9.266 9.58 13.738 14.52 2.44 2.605 4.47 5.601 7.241 7.89 2.61 2.307 5.577 4.208 8.816 5.503-6.237-.751-11.331-5.034-15.263-9.658-9.184-10.951-19.3-21.11-30.172-30.384zm0 0"/>
          </svg>
        </div>

        <!-- Controls -->
        <div class="controls" id="controls">
          <button id="start-btn">🎭 Start</button>
          <button id="stop-btn" disabled>🛑 Stop</button>
          <button id="reset-btn">🔄 Reset</button>
          
          <div class="quantization-control">
            <label>Q: <input type="number" id="q-input" min="2" max="24" value="${this.quantization}"></label>
          </div>
        </div>

        <!-- Status Display -->
        <div class="status" id="status">
          Ready | Q=${this.quantization}
        </div>
      </div>
    `;
  }

  initializeElements() {
    this.leftSeal = this.shadowRoot.getElementById('left-seal');
    this.rightSeal = this.shadowRoot.getElementById('right-seal');
    this.status = this.shadowRoot.getElementById('status');
    
    // Control buttons
    this.shadowRoot.getElementById('start-btn').addEventListener('click', () => this.start());
    this.shadowRoot.getElementById('stop-btn').addEventListener('click', () => this.stop());
    this.shadowRoot.getElementById('reset-btn').addEventListener('click', () => this.reset());
    
    // Quantization input
    const qInput = this.shadowRoot.getElementById('q-input');
    qInput.addEventListener('change', (e) => {
      this.setQuantization(parseInt(e.target.value) || 8);
    });
  }

  // Public API Methods
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.updateStatus('Running...');
    this.updateControls();
    
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
    this.updateStatus(`Stopped | Q=${this.quantization}`);
    this.updateControls();
    
    // Hide seals
    this.leftSeal.classList.remove('active');
    this.rightSeal.classList.remove('active');
    
    // Dispatch event
    this.dispatchEvent(new CustomEvent('siegel-stopped'));
  }

  reset() {
    this.stop();
    this.leftSealFromAngle = 180;
    this.rightSealFromAngle = 0;
    this.leftSealToAngle = null;
    this.rightSealToAngle = null;
    this.updateStatus(`Reset | Q=${this.quantization}`);
    
    // Dispatch event
    this.dispatchEvent(new CustomEvent('siegel-reset'));
  }

  setQuantization(newQ) {
    this.quantization = this.angleCalculator.setQuantization(newQ);
    this.setAttribute('quantization', this.quantization);
    this.shadowRoot.getElementById('q-input').value = this.quantization;
    this.updateStatus(this.isRunning ? 'Running...' : `Ready | Q=${this.quantization}`);
    
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

    this.updateStatus(`L:${this.leftSealFromAngle}°→${this.leftSealToAngle}° R:${this.rightSealFromAngle}°→${this.rightSealToAngle}°`);
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
  updateControls() {
    const startBtn = this.shadowRoot.getElementById('start-btn');
    const stopBtn = this.shadowRoot.getElementById('stop-btn');
    
    startBtn.disabled = this.isRunning;
    stopBtn.disabled = !this.isRunning;
  }

  updateStatus(text) {
    this.status.textContent = text;
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