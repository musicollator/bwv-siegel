// bwv-siegel.js - Simple Equatorial Geodesic Animation
// One blue seal following the equator great circle

import { AngleCalculator } from './src/AngleCalculator.js';

class BwvSiegel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Initialize properties
    this.svgPath = this.getAttribute('svg-path') || 'assets/siegel.svg';
    this.templatePath = this.getAttribute('template-path') || 'bwv-siegel.html';
    this.stylesPath = this.getAttribute('styles-path') || 'bwv-siegel.css';
    
    // 3D Animation state
    this.isRunning = false;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.sphere = null;
    this.leftSeal = null;
    
    // Spherical physics
    this.sphereRadius = 1.0;
    this.leftPosition = null;
    
    // Equatorial motion
    this.azimuthalAngle = Math.PI; // Start at west (180°)
    this.polarAngle = Math.PI/2;   // Equator (90°)
    this.angularSpeed = 0.02;      // Speed around equator
    
    this.animationId = null;
    this.isLoaded = false;
    
    this.loadComponentFiles();
  }

  async loadComponentFiles() {
    try {
      this.shadowRoot.innerHTML = '<div style="padding: 20px; text-align: center;">🎼 Loading Simple BWV Siegel...</div>';
      
      if (typeof THREE === 'undefined') {
        await this.loadThreeJS();
      }
      
      const [htmlResponse, cssResponse] = await Promise.all([
        fetch(this.templatePath),
        fetch(this.stylesPath)
      ]);
      
      if (!htmlResponse.ok || !cssResponse.ok) {
        throw new Error('Template or CSS not found');
      }
      
      const htmlTemplate = await htmlResponse.text();
      const cssStyles = await cssResponse.text();
      
      this.render(htmlTemplate, cssStyles);
      this.initializeThreeJS();
      
      this.isLoaded = true;
      
      // Auto-start the simple animation
      setTimeout(() => this.start(), 100);
      
      console.log('Simple BWV Siegel loaded');
      
    } catch (error) {
      console.error('Failed to load:', error);
      this.shadowRoot.innerHTML = `<div style="padding: 20px; color: red;">❌ Load Error: ${error.message}</div>`;
    }
  }

  async loadThreeJS() {
    return new Promise((resolve, reject) => {
      if (typeof THREE !== 'undefined') {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.onload = () => {
        setTimeout(() => {
          if (typeof THREE !== 'undefined') {
            resolve();
          } else {
            reject(new Error('Three.js failed to load'));
          }
        }, 100);
      };
      script.onerror = () => reject(new Error('Failed to load Three.js'));
      document.head.appendChild(script);
    });
  }

  processTemplate(template) {
    return template
      .replace(/\{\{SVG_PATH\}\}/g, this.svgPath)
      .replace(/\{\{QUANTIZATION\}\}/g, 8)
      .replace(/\{\{RADIUS\}\}/g, 120);
  }

  render(htmlTemplate, cssStyles) {
    // Process template variables
    const processedHtml = this.processTemplate(htmlTemplate);
    const processedCss = this.processTemplate(cssStyles);
    
    this.shadowRoot.innerHTML = `
      <style>${processedCss}</style>
      <div class="siegel-container">
        <canvas id="three-canvas"></canvas>
        ${processedHtml}
      </div>
    `;
  }

  initializeThreeJS() {
    const container = this.shadowRoot.querySelector('.siegel-container');
    const canvas = this.shadowRoot.getElementById('three-canvas');
    
    // Initialize Three.js objects
    this.leftPosition = new THREE.Vector3();
    
    // Scene setup
    this.scene = new THREE.Scene();
    
    // Camera looking at sphere from front
    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.camera.position.set(0, 0, 2);
    this.camera.lookAt(0, 0, 0);
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setClearColor(0x000000, 0);
    
    // Sphere (visible for reference)
    const sphereGeometry = new THREE.SphereGeometry(this.sphereRadius, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff, 
      wireframe: true, 
      transparent: true, 
      opacity: 0.2 
    });
    this.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this.scene.add(this.sphere);
    
    // Seal DOM element
    this.leftSeal = this.shadowRoot.getElementById('left-seal');
    
    // Initialize position at west point of equator
    this.updateSealPosition();
  }

  updateSealPosition() {
    // Calculate position on sphere using spherical coordinates
    this.leftPosition.setFromSphericalCoords(
      this.sphereRadius,
      this.polarAngle,      // π/2 = equator
      this.azimuthalAngle   // 0 to 2π around equator
    );
  }

  moveAlongEquator() {
    // Move around equator (increment azimuthal angle)
    this.azimuthalAngle += this.angularSpeed;
    
    // Keep angle in [0, 2π] range
    if (this.azimuthalAngle > 2 * Math.PI) {
      this.azimuthalAngle -= 2 * Math.PI;
    }
    
    // Update position
    this.updateSealPosition();
  }

  projectToScreen(point3D) {
    const vector = point3D.clone();
    vector.project(this.camera);
    
    const canvas = this.shadowRoot.getElementById('three-canvas');
    const x = (vector.x + 1) * canvas.width / 2;
    const y = (-vector.y + 1) * canvas.height / 2;
    
    return { x, y };
  }

  updateSealDisplay() {
    // Project to screen coordinates
    const screenPos = this.projectToScreen(this.leftPosition);
    
    // Update DOM position
    this.leftSeal.style.left = screenPos.x + 'px';
    this.leftSeal.style.top = screenPos.y + 'px';
    this.leftSeal.style.display = 'block';
    
    // Scale based on distance (closer = larger)
    const scale = Math.max(0.1, (this.leftPosition.z + this.sphereRadius) / (2 * this.sphereRadius));
    this.leftSeal.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }

  animate() {
    if (!this.isRunning) return;
    
    // Move along equator
    this.moveAlongEquator();
    
    // Update visual
    this.updateSealDisplay();
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
    
    // Continue
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  start() {
    if (!this.isLoaded) return;
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.animate();
    
    console.log('🌍 Blue seal starting equatorial journey');
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.leftSeal) this.leftSeal.style.display = 'none';
  }

  // Legacy compatibility for demo
  reset() { this.stop(); this.start(); }
  setQuantization() {} 
  get status() { return { isRunning: this.isRunning }; }
}

customElements.define('bwv-siegel', BwvSiegel);
export default BwvSiegel;