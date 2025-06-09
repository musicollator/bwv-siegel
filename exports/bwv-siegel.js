// bwv-siegel.js - ES6 module version with clean Three.js imports
//
// Usage Examples:
// 
// <!-- Default setup with manual start -->
// <bwv-siegel quantization="8"></bwv-siegel>
//
// <!-- Default setup with auto-start -->
// <bwv-siegel quantization="8" auto-start></bwv-siegel>
//
// <!-- With custom SVG and auto-start -->
// <bwv-siegel svg-path="custom/your-siegel.svg" quantization="12" auto-start></bwv-siegel>
//
// <!-- With all custom assets -->
// <bwv-siegel 
//   svg-path="custom/seal.svg"
//   template-path="custom-template.html" 
//   styles-path="custom-styles.css"
//   freeze-duration="1000"
//   auto-start>
// </bwv-siegel>
//
// Note: Default files are expected in the same directory as this module (exports/).

import { AngleCalculator } from './AngleCalculator.js';
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  SphereGeometry,
  MeshBasicMaterial,
  Mesh,
  Vector3
} from 'https://unpkg.com/three@0.128.0/build/three.module.js';

// Constants
const DEFAULT_PATHS = {
  SVG: 'bwv-siegel.svg',      // Same directory as module
  TEMPLATE: 'bwv-siegel.html', // Same directory as module  
  STYLES: 'bwv-siegel.css'     // Same directory as module
};

const ANIMATION_SETTINGS = {
  SPHERE_RADIUS: 1.0,
  ANGULAR_SPEED: 0.02,
  DEFAULT_QUANTIZATION: 8,
  DEFAULT_FREEZE_DURATION: 800,
  DECELERATION_ZONE: 1.2,
  MIN_SPEED: 0.15,
  MAX_SPEED: 1.0,
  MIN_TRAVEL_DISTANCE: Math.PI / 4,
  NEAR_C_TOLERANCE: 0.005,
  PATH_START_DISTANCE: 0.01,  // Increased: must be > NEAR_C_TOLERANCE to escape freeze zone
  POST_CHANGE_DISTANCE: 0.02  // Even larger distance after direction changes
};

const CAMERA_SETTINGS = {
  FOV: 75,
  NEAR: 0.1,
  FAR: 1000,
  POSITION_Z: 2
};

const SPHERE_MATERIAL = {
  color: 0xffffff,
  opacity: 0.2,
  wireframe: true,
  transparent: true
};

class GeodesicPath {
  constructor(azimuthFromC, angularDistance = 0) {
    this.azimuthFromC = azimuthFromC;
    this.angularDistance = angularDistance;
    this.pointC = null;
  }

  initialize() {
    this.pointC = new Vector3(0, 0, 1);
  }

  getPosition() {
    const azimuthRad = (this.azimuthFromC * Math.PI) / 180;
    const directionX = Math.sin(azimuthRad);
    const directionY = -Math.cos(azimuthRad);

    const x = Math.sin(this.angularDistance) * directionX;
    const y = Math.sin(this.angularDistance) * directionY;
    const z = Math.cos(this.angularDistance);

    return new Vector3(x, y, z);
  }

  getVelocity() {
    const azimuthRad = (this.azimuthFromC * Math.PI) / 180;
    const directionX = Math.sin(azimuthRad);
    const directionY = -Math.cos(azimuthRad);

    const vx = Math.cos(this.angularDistance) * directionX;
    const vy = Math.cos(this.angularDistance) * directionY;
    const vz = -Math.sin(this.angularDistance);

    return new Vector3(vx, vy, vz).normalize();
  }

  advance(deltaTheta) {
    this.angularDistance += deltaTheta;
    if (this.angularDistance >= 2 * Math.PI) {
      this.angularDistance -= 2 * Math.PI;
    }
  }

  isNearC(tolerance = ANIMATION_SETTINGS.NEAR_C_TOLERANCE) {
    return this.angularDistance < tolerance || 
           this.angularDistance > (2 * Math.PI - tolerance);
  }
}

class BwvSiegel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this._initializeAttributes();
    this._initializeState();
    
    this.loadComponentFiles();
  }

  _initializeAttributes() {
    this.svgPath = this.getAttribute('svg-path') || DEFAULT_PATHS.SVG;
    this.templatePath = this.getAttribute('template-path') || DEFAULT_PATHS.TEMPLATE;
    this.stylesPath = this.getAttribute('styles-path') || DEFAULT_PATHS.STYLES;
    this.quantization = parseInt(this.getAttribute('quantization')) || ANIMATION_SETTINGS.DEFAULT_QUANTIZATION;
    this.freezeDuration = parseInt(this.getAttribute('freeze-duration')) || ANIMATION_SETTINGS.DEFAULT_FREEZE_DURATION;
    this.autoStart = this.hasAttribute('auto-start'); // Check for auto-start attribute
  }

  _initializeState() {
    // Animation state
    this.isRunning = false;
    this.isLoaded = false;
    this.animationId = null;

    // 3D Objects
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.sphere = null;
    this.leftSeal = null;
    this.rightSeal = null;

    // Physics
    this.sphereRadius = ANIMATION_SETTINGS.SPHERE_RADIUS;
    this.pointC = null;
    this.bluePath = null;
    this.goldPath = null;
    this.angularSpeed = ANIMATION_SETTINGS.ANGULAR_SPEED;

    // Timing
    this.lastAzimuthChange = 0;
    this.lastChangeAngularDistance = 0;
    this.freezeAtC = false;
    this.freezeStartTime = 0;

    // Calculator
    this.angleCalculator = new AngleCalculator(this.quantization);
    this.resizeObserver = null;
  }

  async loadComponentFiles() {
    try {
      const baseUrl = this._getBaseUrl();
      const [htmlTemplate, cssStyles] = await this._fetchAssets(baseUrl);
      
      this._renderComponent(htmlTemplate, cssStyles);
      this._initializeThreeJS();
      
      this.isLoaded = true;
      
      // Only auto-start if auto-start attribute is present
      if (this.autoStart) {
        setTimeout(() => this.start(), 100);
        console.log('Dual Seal BWV Siegel loaded successfully with auto-start!');
      } else {
        console.log('Dual Seal BWV Siegel loaded successfully (manual start required)!');
      }

    } catch (error) {
      console.error('Critical error during component initialization:', error);
      this._showErrorMessage(error);
    }
  }

  _getBaseUrl() {
    const baseUrl = new URL(import.meta.url);
    baseUrl.pathname = baseUrl.pathname.replace(/[^/]*$/, '');
    return baseUrl;
  }

  async _fetchAssets(baseUrl) {
    const templateUrl = new URL(this.templatePath, baseUrl).href;
    const stylesUrl = new URL(this.stylesPath, baseUrl).href;

    try {
      const [htmlResponse, cssResponse] = await Promise.all([
        fetch(templateUrl),
        fetch(stylesUrl)
      ]);

      if (!htmlResponse.ok || !cssResponse.ok) {
        console.warn(`Template or CSS files not found (${templateUrl}, ${stylesUrl}), using minimal defaults`);
        return this._getDefaultAssets();
      }

      return Promise.all([
        htmlResponse.text(),
        cssResponse.text()
      ]);
    } catch (error) {
      console.warn('Failed to fetch assets, using defaults:', error.message);
      return this._getDefaultAssets();
    }
  }

  _getDefaultAssets() {
    const defaultHtml = `
      <div id="left-seal" class="seal blue-seal">
        <div class="seal-content">🔵</div>
      </div>
      <div id="right-seal" class="seal gold-seal">
        <div class="seal-content">🟡</div>
      </div>
    `;

    const defaultCss = `
      .siegel-container {
        position: relative;
        width: 100%;
        height: 400px;
        /* background: linear-gradient(135deg, #1a1a2e, #16213e); 
        border-radius: 10px; */
        overflow: hidden;
      }
      #three-canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
      .seal {
        position: absolute;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: none;
        z-index: 10;
        transition: transform 0.1s ease;
      }
      .blue-seal {
        background: radial-gradient(circle, #4a90e2, #2171b5);
        z-index: 12;
      }
      .gold-seal {
        background: radial-gradient(circle, #f39c12, #d68910);
        z-index: 11;
      }
      .seal-content {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        font-size: 20px;
      }
    `;

    return [defaultHtml, defaultCss];
  }

  _showErrorMessage(error) {
    console.error('Failed to load:', error);
    this.shadowRoot.innerHTML = `
      <div style="padding: 20px; color: red;">
        ❌ Load Error: ${error.message}
      </div>
    `;
  }

  _processTemplate(template) {
    // Resolve SVG path relative to module location if it's a default path
    const resolvedSvgPath = this._resolveSvgPath();
    
    return template
      .replace(/\{\{SVG_PATH\}\}/g, resolvedSvgPath)
      .replace(/\{\{QUANTIZATION\}\}/g, this.quantization)
      .replace(/\{\{RADIUS\}\}/g, 120);
  }

  _resolveSvgPath() {
    // If it's the default SVG or a relative path, resolve it relative to module
    if (this.svgPath === DEFAULT_PATHS.SVG || !this.svgPath.includes('://')) {
      const baseUrl = this._getBaseUrl();
      return new URL(this.svgPath, baseUrl).href;
    }
    // If it's already an absolute URL, use as-is
    return this.svgPath;
  }

  _renderComponent(htmlTemplate, cssStyles) {
    const processedHtml = this._processTemplate(htmlTemplate);
    const processedCss = this._processTemplate(cssStyles);

    this.shadowRoot.innerHTML = `
      <style>${processedCss}</style>
      <div class="siegel-wrapper">
        <canvas id="three-canvas"></canvas>
        ${processedHtml}
      </div>
    `;
  }

  _initializeThreeJS() {
    const container = this.shadowRoot.querySelector('.siegel-wrapper');
    const canvas = this.shadowRoot.getElementById('three-canvas');

    this._setupScene();
    this._setupCamera(container);
    this._setupRenderer(canvas, container);
    this._setupSphere();
    this._setupSeals();
    this._setupPaths();
    this._setupResizeObserver(container);
  }

  _setupScene() {
    this.pointC = new Vector3(0, 0, 1);
    this.scene = new Scene();
  }

  _setupCamera(container) {
    this.camera = new PerspectiveCamera(
      CAMERA_SETTINGS.FOV,
      container.clientWidth / container.clientHeight,
      CAMERA_SETTINGS.NEAR,
      CAMERA_SETTINGS.FAR
    );
    this.camera.position.set(0, 0, CAMERA_SETTINGS.POSITION_Z);
    this.camera.lookAt(0, 0, 0);
  }

  _setupRenderer(canvas, container) {
    this.renderer = new WebGLRenderer({ canvas, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setClearColor(0x000000, 0);
  }

  _setupSphere() {
    const geometry = new SphereGeometry(this.sphereRadius, 32, 32);
    const material = new MeshBasicMaterial(SPHERE_MATERIAL);
    this.sphere = new Mesh(geometry, material);
    this.scene.add(this.sphere);
  }

  _setupSeals() {
    this.leftSeal = this.shadowRoot.getElementById('left-seal');
    this.rightSeal = this.shadowRoot.getElementById('right-seal');
    
    console.log('🎭 Seal setup:', {
      leftSeal: !!this.leftSeal,
      rightSeal: !!this.rightSeal,
      leftSealId: this.leftSeal?.id,
      rightSealId: this.rightSeal?.id
    });
    
    if (!this.leftSeal || !this.rightSeal) {
      console.error('🚨 Missing seal elements in DOM!');
      console.log('📋 Available elements:', 
        Array.from(this.shadowRoot.querySelectorAll('*')).map(el => ({ 
          tag: el.tagName, 
          id: el.id, 
          classes: el.className 
        }))
      );
    }
  }

  _setupPaths() {
    // Start outside the freeze zone to avoid getting stuck
    const initialDistance = ANIMATION_SETTINGS.POST_CHANGE_DISTANCE;
    
    this.bluePath = new GeodesicPath(90, initialDistance);
    this.bluePath.initialize();

    const goldAzimuth = (90 + 180) % 360;
    this.goldPath = new GeodesicPath(goldAzimuth, initialDistance);
    this.goldPath.initialize();
    
    // Reset last change tracking to allow immediate direction changes
    this.lastChangeAngularDistance = initialDistance;
    
    console.log('🛤️ Paths initialized:', {
      blueAzimuth: this.bluePath.azimuthFromC,
      blueDistance: this.bluePath.angularDistance,
      goldAzimuth: this.goldPath.azimuthFromC,
      goldDistance: this.goldPath.angularDistance,
      lastChangeDistance: this.lastChangeAngularDistance,
      nearCTolerance: ANIMATION_SETTINGS.NEAR_C_TOLERANCE,
      safelyOutsideFreezeZone: this.bluePath.angularDistance > ANIMATION_SETTINGS.NEAR_C_TOLERANCE
    });
  }

  _setupResizeObserver(container) {
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(container);
  }

  _getSpeedMultiplier(angularDistance) {
    const distanceFromC = Math.min(angularDistance, 2 * Math.PI - angularDistance);

    if (distanceFromC < ANIMATION_SETTINGS.DECELERATION_ZONE) {
      const progress = distanceFromC / ANIMATION_SETTINGS.DECELERATION_ZONE;
      const smoothProgress = 1 - Math.pow(1 - progress, 3);
      return ANIMATION_SETTINGS.MIN_SPEED + 
             (ANIMATION_SETTINGS.MAX_SPEED - ANIMATION_SETTINGS.MIN_SPEED) * smoothProgress;
    }
    
    return ANIMATION_SETTINGS.MAX_SPEED;
  }

  _performAzimuthChange() {
    const currentBlueAzimuth = this.bluePath.azimuthFromC;
    const currentGoldAzimuth = this.goldPath.azimuthFromC;

    try {
      const newBlueAzimuth = this.angleCalculator.getNextAzimuth(currentBlueAzimuth);
      const newGoldAzimuth = this.angleCalculator.getNextAzimuth(currentGoldAzimuth, newBlueAzimuth);

      this._updatePaths(newBlueAzimuth, newGoldAzimuth);
      this._trackDirectionChange();

      console.log(`🔄 Azimuth change: Blue=${newBlueAzimuth}°, Gold=${newGoldAzimuth}°`);

    } catch (error) {
      this._handleCalculatorError(error, currentBlueAzimuth, currentGoldAzimuth);
    }
  }

  _updatePaths(newBlueAzimuth, newGoldAzimuth) {
    this.bluePath.azimuthFromC = newBlueAzimuth;
    this.bluePath.angularDistance = ANIMATION_SETTINGS.POST_CHANGE_DISTANCE; // Use larger distance to escape freeze zone

    this.goldPath.azimuthFromC = newGoldAzimuth;
    this.goldPath.angularDistance = ANIMATION_SETTINGS.POST_CHANGE_DISTANCE; // Use larger distance to escape freeze zone
    
    console.log(`🔄 Paths updated: Blue distance=${this.bluePath.angularDistance}, Gold distance=${this.goldPath.angularDistance} (escaping freeze zone)`);
  }

  _trackDirectionChange() {
    this.lastAzimuthChange = Date.now();
    this.lastChangeAngularDistance = this.bluePath.angularDistance;
  }

  _handleCalculatorError(error, currentBlueAzimuth, currentGoldAzimuth) {
    console.error('🚨 AngleCalculator failed:', error.message);
    console.error('🔧 Animation parameters:', {
      quantization: this.quantization,
      currentBlueAzimuth,
      currentGoldAzimuth,
      blueAngularDistance: this.bluePath.angularDistance,
      goldAngularDistance: this.goldPath.angularDistance
    });

    this.stop();
    throw error;
  }

  _moveAlongGeodesic() {
    const wasNearC = this.bluePath.isNearC();
    
    if (this._shouldProcessAtPointC()) {
      if (this.frameCount % 60 === 1) {
        console.log('📍 At point C - processing logic');
      }
      this._handlePointCLogic();
      return;
    }

    this._ensureFreezeDisabled();
    this._advancePaths();
    
    if (this.frameCount % 60 === 1 && !wasNearC) {
      console.log('🚀 Moving along geodesic - advancing paths');
    }
  }

  _shouldProcessAtPointC() {
    const isNear = this.bluePath.isNearC();
    if (isNear && this.frameCount % 60 === 1) {
      console.log(`📍 Near point C: distance=${this.bluePath.angularDistance.toFixed(4)}, tolerance=${ANIMATION_SETTINGS.NEAR_C_TOLERANCE}`);
    }
    return isNear;
  }

  _handlePointCLogic() {
    const distanceSinceLastChange = Math.abs(
      this.bluePath.angularDistance - this.lastChangeAngularDistance
    );

    if (this.frameCount % 60 === 1) {
      console.log(`🔄 Point C logic: distanceSinceLastChange=${distanceSinceLastChange.toFixed(4)}, minRequired=${ANIMATION_SETTINGS.MIN_TRAVEL_DISTANCE.toFixed(4)}, freezeAtC=${this.freezeAtC}`);
    }

    if (this._shouldStartFreeze(distanceSinceLastChange)) {
      if (this.freezeDuration === 0) {
        console.log('⚡ Instant direction change (freeze-duration=0)');
        this._performAzimuthChange();
      } else {
        console.log('❄️ Starting freeze period');
        this._startFreeze();
        return;
      }
    }

    if (this._shouldEndFreeze()) {
      console.log('🔥 Ending freeze period');
      this._endFreeze();
    }
  }

  _shouldStartFreeze(distanceSinceLastChange) {
    return !this.freezeAtC && distanceSinceLastChange > ANIMATION_SETTINGS.MIN_TRAVEL_DISTANCE;
  }

  _startFreeze() {
    this.freezeAtC = true;
    this.freezeStartTime = Date.now();
    console.log(`❄️ Seals frozen at point C for ${this.freezeDuration}ms - brief pause!`);
  }

  _shouldEndFreeze() {
    if (!this.freezeAtC) return false;
    const freezeElapsed = Date.now() - this.freezeStartTime;
    return freezeElapsed >= this.freezeDuration;
  }

  _endFreeze() {
    this.freezeAtC = false;
    console.log('🔥 Freeze period ended - performing direction change and escaping freeze zone');
    this._performAzimuthChange();
  }

  _ensureFreezeDisabled() {
    this.freezeAtC = false;
  }

  _advancePaths() {
    if (this.freezeAtC) return;

    const speedMultiplier = this._getSpeedMultiplier(this.bluePath.angularDistance);
    const dynamicSpeed = this.angularSpeed * speedMultiplier;

    this.bluePath.advance(dynamicSpeed);
    this.goldPath.advance(dynamicSpeed);
  }

  _projectToScreen(point3D) {
    const vector = point3D.clone();
    vector.project(this.camera);

    const canvas = this.shadowRoot.getElementById('three-canvas');
    const x = (vector.x + 1) * canvas.width / 2;
    const y = (-vector.y + 1) * canvas.height / 2;

    return { x, y };
  }

  _updateSealDisplay() {
    if (this.freezeAtC) {
      this._updateSealsAtPointC();
    } else {
      this._updateSealPosition(this.bluePath, this.leftSeal, 'Blue JSB');
      this._updateSealPosition(this.goldPath, this.rightSeal, 'Gold BJS');
    }
  }

  _updateSealsAtPointC() {
    const screenPos = this._projectToScreen(this.pointC);
    const scale = Math.max(0.1, (this.pointC.z + 1) / 2);
    const transform = `translate(-50%, -50%) scale(${scale})`;

    this._positionSeal(this.leftSeal, screenPos, transform);
    this._positionSeal(this.rightSeal, screenPos, transform);
  }

  _updateSealPosition(path, sealElement, sealName) {
    const position = path.getPosition();
    const screenPos = this._projectToScreen(position);
    const scale = Math.max(0.1, (position.z + 1) / 2);
    const transform = `translate(-50%, -50%) scale(${scale})`;

    this._positionSeal(sealElement, screenPos, transform);
  }

  _positionSeal(sealElement, screenPos, transform) {
    if (!sealElement) {
      console.warn('🚫 Seal element is null');
      return;
    }
    
    sealElement.style.left = screenPos.x + 'px';
    sealElement.style.top = screenPos.y + 'px';
    sealElement.style.display = 'block';
    sealElement.style.transform = transform;
  }

  animate() {
    if (!this.isRunning) {
      console.log('🛑 Animation stopped');
      return;
    }

    // Debug every 60 frames (1 second at 60fps)
    const frameCount = (this.frameCount || 0) + 1;
    this.frameCount = frameCount;
    
    if (frameCount % 60 === 1) {
      console.log(`🎬 Frame ${frameCount}: Blue distance=${this.bluePath.angularDistance.toFixed(4)}, Gold distance=${this.goldPath.angularDistance.toFixed(4)}`);
    }

    // Move along geodesic
    this._moveAlongGeodesic();

    // Update visual
    this._updateSealDisplay();

    // Render scene
    this.renderer.render(this.scene, this.camera);

    // Continue
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  start() {
    if (!this.isLoaded) {
      console.warn('🚫 Cannot start: component not loaded yet');
      return;
    }
    if (this.isRunning) {
      console.warn('🚫 Already running');
      return;
    }

    console.log('🎯 Starting animation...');
    console.log('📍 Blue path:', this.bluePath ? `azimuth=${this.bluePath.azimuthFromC}°, distance=${this.bluePath.angularDistance}` : 'null');
    console.log('📍 Gold path:', this.goldPath ? `azimuth=${this.goldPath.azimuthFromC}°, distance=${this.goldPath.angularDistance}` : 'null');
    console.log('🎭 Seals:', {
      leftSeal: !!this.leftSeal,
      rightSeal: !!this.rightSeal,
      scene: !!this.scene,
      camera: !!this.camera,
      renderer: !!this.renderer
    });

    // Test initial positioning
    if (this.bluePath && this.leftSeal) {
      const bluePos = this.bluePath.getPosition();
      const blueScreen = this._projectToScreen(bluePos);
      console.log('🔵 Initial blue position:', { threeD: bluePos, screen: blueScreen });
    }

    this.isRunning = true;
    this.animate();

    console.log('🌍 Blue JSB and Gold BJS seals starting synchronized geodesic dance with AngleCalculator!');
  }

  stop() {
    this.isRunning = false;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    if (this.leftSeal) this.leftSeal.style.display = 'none';
    if (this.rightSeal) this.rightSeal.style.display = 'none';
  }

  handleResize() {
    if (!this.renderer || !this.camera || !this.isLoaded) return;

    const container = this.shadowRoot.querySelector('.siegel-wrapper');
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    if (!this.isRunning) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  disconnectedCallback() {
    this.stop();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  // Public API methods
  reset() { 
    this.stop(); 
  }

  setQuantization(newQ) {
    this.quantization = newQ;
    this.angleCalculator.setQuantization(newQ);
    console.log(`🔧 Quantization set to ${newQ}`);
  }

  setFreezeDuration(milliseconds) {
    this.freezeDuration = Math.max(0, milliseconds);
    console.log(`❄️ Freeze duration set to ${this.freezeDuration}ms (default: 800ms)`);
  }

  setSvgPath(path) {
    this.svgPath = path;
    console.log(`🖼️ SVG path set to: ${path}`);
  }

  setAutoStart(enabled) {
    this.autoStart = enabled;
    if (enabled) {
      this.setAttribute('auto-start', '');
    } else {
      this.removeAttribute('auto-start');
    }
    console.log(`🚀 Auto-start ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Convenience method to reset to default SVG
  useDefaultSvg() {
    this.setSvgPath(DEFAULT_PATHS.SVG);
  }

  get status() {
    const currentSpeedMultiplier = this.bluePath ? 
      this._getSpeedMultiplier(this.bluePath.angularDistance) : 1.0;

    return {
      isRunning: this.isRunning,
      isLoaded: this.isLoaded,
      autoStart: this.autoStart,
      quantization: this.quantization,
      frozenAtC: this.freezeAtC,
      freezeProgress: this.freezeAtC ? 
        (Date.now() - this.freezeStartTime) / this.freezeDuration : 0,
      currentSpeed: (currentSpeedMultiplier * 100).toFixed(0) + '%',
      speedMultiplier: currentSpeedMultiplier,
      blueJSB: {
        currentAzimuth: this.bluePath ? this.bluePath.azimuthFromC : 0,
        angularDistance: this.bluePath ? this.bluePath.angularDistance : 0
      },
      goldBJS: {
        currentAzimuth: this.goldPath ? this.goldPath.azimuthFromC : 0,
        angularDistance: this.goldPath ? this.goldPath.angularDistance : 0
      }
    };
  }
}

customElements.define('bwv-siegel', BwvSiegel);
export default BwvSiegel;