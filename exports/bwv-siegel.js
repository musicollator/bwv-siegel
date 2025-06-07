// bwv-siegel.js - ES6 module version with clean Three.js imports
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

class GeodesicPath {
  constructor(azimuthFromC, angularDistance = 0) {
    this.azimuthFromC = azimuthFromC;
    this.angularDistance = angularDistance;
    this.pointC = null;
  }

  initialize() {
    this.pointC = new Vector3(0, 0, 1);  // Clean ES6 import
  }

  getPosition() {
    const azimuthRad = (this.azimuthFromC * Math.PI) / 180;
    const directionX = Math.sin(azimuthRad);
    const directionY = -Math.cos(azimuthRad);

    const x = Math.sin(this.angularDistance) * directionX;
    const y = Math.sin(this.angularDistance) * directionY;
    const z = Math.cos(this.angularDistance);

    return new Vector3(x, y, z);  // Clean ES6 import
  }

  getVelocity() {
    const azimuthRad = (this.azimuthFromC * Math.PI) / 180;
    const directionX = Math.sin(azimuthRad);
    const directionY = -Math.cos(azimuthRad);

    const vx = Math.cos(this.angularDistance) * directionX;
    const vy = Math.cos(this.angularDistance) * directionY;
    const vz = -Math.sin(this.angularDistance);

    return new Vector3(vx, vy, vz).normalize();  // Clean ES6 import
  }

  advance(deltaTheta) {
    this.angularDistance += deltaTheta;
    if (this.angularDistance >= 2 * Math.PI) {
      this.angularDistance -= 2 * Math.PI;
    }
  }

  isNearC(tolerance = 0.1) {
    return this.angularDistance < tolerance || this.angularDistance > (2 * Math.PI - tolerance);
  }
}

class BwvSiegel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Initialize properties
    this.svgPath = this.getAttribute('svg-path') || 'assets/siegel.svg';
    this.templatePath = this.getAttribute('template-path') || 'bwv-siegel.html';
    this.stylesPath = this.getAttribute('styles-path') || 'bwv-siegel.css';

    // NEW: Initialize freeze duration from attribute
    this.freezeDuration = parseInt(this.getAttribute('freeze-duration')) || 800;

    // 3D Animation state
    this.isRunning = false;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.sphere = null;
    this.leftSeal = null;
    this.rightSeal = null;

    // Spherical physics
    this.sphereRadius = 1.0;
    this.pointC = null;

    // Geodesic motion
    this.bluePath = null;
    this.goldPath = null;
    this.angularSpeed = 0.02;
    this.quantization = 8;
    this.lastAzimuthChange = 0;

    this.lastChangeAngularDistance = 0;  // Track angular distance when last direction change occurred

    // Freeze at point C feature
    this.freezeAtC = false;
    this.freezeStartTime = 0;

    // AngleCalculator integration
    this.angleCalculator = new AngleCalculator(this.quantization);

    this.animationId = null;
    this.isLoaded = false;

    this.loadComponentFiles();
  }

  async loadComponentFiles() {
    try {
      this.shadowRoot.innerHTML = '<div style="padding: 20px; text-align: center;">🎼 Loading Dual Seal BWV Siegel...</div>';

      // Get the base URL from where this module was loaded
      const moduleUrl = new URL(import.meta.url);
      const baseUrl = moduleUrl.href.substring(0, moduleUrl.href.lastIndexOf('/') + 1);

      // Construct full URLs for template and styles if they are relative paths
      const templateUrl = this.templatePath.startsWith('http')
        ? this.templatePath
        : baseUrl + this.templatePath;

      const stylesUrl = this.stylesPath.startsWith('http')
        ? this.stylesPath
        : baseUrl + this.stylesPath;

      const [htmlResponse, cssResponse] = await Promise.all([
        fetch(templateUrl),
        fetch(stylesUrl)
      ]);

      if (!htmlResponse.ok || !cssResponse.ok) {
        throw new Error('Template or CSS not found');
      }

      const htmlTemplate = await htmlResponse.text();
      const cssStyles = await cssResponse.text();

      this.render(htmlTemplate, cssStyles);
      this.initializeThreeJS();

      this.isLoaded = true;
      setTimeout(() => this.start(), 100);

      console.log('Dual Seal BWV Siegel loaded with ES6 Three.js modules!');

    } catch (error) {
      console.error('Failed to load:', error);
      this.shadowRoot.innerHTML = `<div style="padding: 20px; color: red;">❌ Load Error: ${error.message}</div>`;
    }
  }

  processTemplate(template) {
    return template
      .replace(/\{\{SVG_PATH\}\}/g, this.svgPath)
      .replace(/\{\{QUANTIZATION\}\}/g, this.quantization)
      .replace(/\{\{RADIUS\}\}/g, 120);
  }

  render(htmlTemplate, cssStyles) {
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

    // Initialize with clean ES6 imports
    this.pointC = new Vector3(0, 0, 1);

    // Scene setup
    this.scene = new Scene();

    // Camera
    this.camera = new PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.camera.position.set(0, 0, 2);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new WebGLRenderer({ canvas: canvas, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setClearColor(0x000000, 0);

    // Sphere
    const sphereGeometry = new SphereGeometry(this.sphereRadius, 32, 32);
    const sphereMaterial = new MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.2
    });
    this.sphere = new Mesh(sphereGeometry, sphereMaterial);
    this.scene.add(this.sphere);

    // Seal DOM elements
    this.leftSeal = this.shadowRoot.getElementById('left-seal');
    this.rightSeal = this.shadowRoot.getElementById('right-seal');

    // Initialize paths
    this.bluePath = new GeodesicPath(90, Math.PI);
    this.bluePath.initialize();

    const goldAzimuth = (90 + 180) % 360;
    this.goldPath = new GeodesicPath(goldAzimuth, Math.PI);
    this.goldPath.initialize();

    // Add resize listener
    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });
    this.resizeObserver.observe(container);
  }

  // Gaussian probability for azimuth deviation (for smooth selection weighting)
  gaussianProbability(deviationAngle) {
    const sigma = 45; // Standard deviation in degrees
    const normalized = deviationAngle / sigma;
    return Math.exp(-0.5 * normalized * normalized);
  }

  // Calculate speed multiplier based on distance from point C (for smooth deceleration/acceleration)
  getSpeedMultiplier(angularDistance) {
    // Calculate shortest distance to point C (at 0 or 2π)
    const distanceFromC = Math.min(angularDistance, 2 * Math.PI - angularDistance);

    // Create deceleration zone around point C
    const decelerationZone = 1.2; // Radians around C where deceleration occurs
    const minSpeed = 0.15;         // Minimum speed (15% of normal)
    const maxSpeed = 1.0;          // Maximum speed (100% of normal)

    if (distanceFromC < decelerationZone) {
      // Within deceleration zone - smooth transition from slow to fast
      const progress = distanceFromC / decelerationZone;
      // Use smooth ease-out curve
      const smoothProgress = 1 - Math.pow(1 - progress, 3);
      return minSpeed + (maxSpeed - minSpeed) * smoothProgress;
    } else {
      // Outside deceleration zone - full speed
      return maxSpeed;
    }
  }

  // NEW: Use AngleCalculator for azimuth selection
  selectNewAzimuth(currentAzimuth, otherSealAzimuth = null) {
    console.log(`🎯 At point C! Current azimuth: ${currentAzimuth}°${otherSealAzimuth !== null ? `, Other seal: ${otherSealAzimuth}°` : ''}`);

    // Use AngleCalculator to get allowed angles based on entry angle and opposition rule
    const allowedAngles = this.angleCalculator.getSetOfAllowedAngles(currentAzimuth, otherSealAzimuth);

    console.log(`📐 AngleCalculator allowed angles: [${allowedAngles.join(', ')}]°`);

    if (allowedAngles.length === 0) {
      console.log('⚠️ No allowed angles from AngleCalculator - fallback needed');
      // Fallback: use all quantized angles except the other seal's
      const allAngles = this.angleCalculator.getAllQuantizedAngles();
      const fallbackAngles = allAngles.filter(angle =>
        otherSealAzimuth === null || angle !== otherSealAzimuth
      );
      if (fallbackAngles.length > 0) {
        const randomIndex = Math.floor(Math.random() * fallbackAngles.length);
        const selectedAngle = fallbackAngles[randomIndex];
        console.log(`🎲 Fallback selected azimuth: ${selectedAngle}°`);
        return selectedAngle;
      }
      return currentAzimuth; // Ultimate fallback
    }

    // Apply Gaussian probability weighting to the allowed angles
    const weightedAngles = [];
    for (const azimuth of allowedAngles) {
      // Calculate deviation angle (smallest angle between directions)
      let deviation = Math.abs(azimuth - currentAzimuth);
      if (deviation > 180) deviation = 360 - deviation;

      const probability = this.gaussianProbability(deviation);
      weightedAngles.push({ azimuth, deviation, probability });
    }

    // Weighted random selection
    const totalWeight = weightedAngles.reduce((sum, a) => sum + a.probability, 0);
    let random = Math.random() * totalWeight;

    for (const option of weightedAngles) {
      random -= option.probability;
      if (random <= 0) {
        console.log(`🎲 Selected azimuth: ${option.azimuth}° (deviation: ${option.deviation.toFixed(1)}°)`);
        return option.azimuth;
      }
    }

    // Fallback (shouldn't happen)
    console.log(`🎲 Fallback to first option: ${weightedAngles[0].azimuth}°`);
    return weightedAngles[0].azimuth;
  }

  performAzimuthChange() {
    const currentBlueAzimuth = this.bluePath.azimuthFromC;
    const currentGoldAzimuth = this.goldPath.azimuthFromC;

    try {
      // STEP 1: Blue seal selects first (single argument)
      const newBlueAzimuth = this.angleCalculator.getNextAzimuth(currentBlueAzimuth);

      // STEP 2: Gold seal selects with complex probability (dual argument)
      const newGoldAzimuth = this.angleCalculator.getNextAzimuth(currentGoldAzimuth, newBlueAzimuth);

      // Update both paths
      this.bluePath.azimuthFromC = newBlueAzimuth;
      this.bluePath.angularDistance = 0.01;

      this.goldPath.azimuthFromC = newGoldAzimuth;
      this.goldPath.angularDistance = 0.01;

      // Track when and where direction change occurred
      this.lastAzimuthChange = Date.now();
      this.lastChangeAngularDistance = this.bluePath.angularDistance;

      console.log(`🔄 Azimuth change: Blue=${newBlueAzimuth}°, Gold=${newGoldAzimuth}°`);

    } catch (error) {
      console.error('🚨 AngleCalculator failed:', error.message);
      console.error('🔧 Animation parameters:', {
        quantization: this.quantization,
        currentBlueAzimuth,
        currentGoldAzimuth,
        blueAngularDistance: this.bluePath.angularDistance,
        goldAngularDistance: this.goldPath.angularDistance
      });

      // Stop animation to prevent further errors
      this.stop();
      throw error; // Re-throw to surface the problem
    }
  }

  moveAlongGeodesic() {
    // Check if near point C for potential freeze and azimuth change
    if (this.bluePath.isNearC(0.005)) {

      // Calculate how far seals have traveled since last direction change
      const distanceSinceLastChange = Math.abs(this.bluePath.angularDistance - this.lastChangeAngularDistance);
      const minTravelDistance = Math.PI / 4; // Must travel at least 45 degrees (π/4 radians) before next change

      // Start freeze if not already frozen and seals have traveled enough distance
      if (!this.freezeAtC && distanceSinceLastChange > minTravelDistance) {

        if (this.freezeDuration === 0) {
          // Instant direction change when freeze-duration is 0
          this.performAzimuthChange();
        } else {
          // Start freeze for freeze-duration > 0
          this.freezeAtC = true;
          this.freezeStartTime = Date.now();
          console.log('❄️ Seals frozen at point C - brief pause!');
          return; // Don't move during first freeze frame
        }
      }

      // Check if freeze duration has elapsed
      if (this.freezeAtC) {
        const freezeElapsed = Date.now() - this.freezeStartTime;

        if (freezeElapsed >= this.freezeDuration) {
          // End freeze and change direction
          this.freezeAtC = false;
          this.performAzimuthChange();
        } else {
          return; // Still frozen
        }
      }
    } else {
      // Not near C - ensure freeze is disabled
      this.freezeAtC = false;
    }

    // Calculate dynamic speed based on distance from point C
    // Only move if not frozen
    if (!this.freezeAtC) {
      const speedMultiplier = this.getSpeedMultiplier(this.bluePath.angularDistance);
      const dynamicSpeed = this.angularSpeed * speedMultiplier;

      // Both seals advance with the same dynamic speed
      this.bluePath.advance(dynamicSpeed);
      this.goldPath.advance(dynamicSpeed);
    }
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
    // Special handling when frozen at point C - force perfect alignment
    if (this.freezeAtC) {
      this.updateSealsAtPointC();
    } else {
      // Normal movement - update positions independently
      this.updateSealPosition(this.bluePath, this.leftSeal, 'Blue JSB');
      this.updateSealPosition(this.goldPath, this.rightSeal, 'Gold BJS');
    }
  }

  updateSealsAtPointC() {
    // When frozen at C, position both seals at the exact same location (point C)
    const pointCPosition = this.pointC; // Point C is at (0, 0, 1)
    const screenPos = this.projectToScreen(pointCPosition);

    // Both seals positioned at exact same spot
    const scale = Math.max(0.1, (pointCPosition.z + 1) / 2); // Same scale
    const transform = `translate(-50%, -50%) scale(${scale})`;

    // Blue seal (left/top layer due to higher z-index)
    this.leftSeal.style.left = screenPos.x + 'px';
    this.leftSeal.style.top = screenPos.y + 'px';
    this.leftSeal.style.display = 'block';
    this.leftSeal.style.transform = transform;

    // Gold seal (right/bottom layer) - exactly same position
    this.rightSeal.style.left = screenPos.x + 'px';
    this.rightSeal.style.top = screenPos.y + 'px';
    this.rightSeal.style.display = 'block';
    this.rightSeal.style.transform = transform;
  }

  updateSealPosition(path, sealElement, sealName) {
    // Get current position from geodesic path
    const position = path.getPosition();

    // Always visible - seals remain shown on both sides
    const isVisible = true;

    if (isVisible) {
      // Project to screen coordinates
      const screenPos = this.projectToScreen(position);

      // Update DOM position
      sealElement.style.left = screenPos.x + 'px';
      sealElement.style.top = screenPos.y + 'px';
      sealElement.style.display = 'block';

      // Scale based on distance (closer = larger)
      const scale = Math.max(0.1, (position.z + 1) / 2);
      sealElement.style.transform = `translate(-50%, -50%) scale(${scale})`;
    }
  }

  animate() {
    if (!this.isRunning) return;

    // Move along geodesic
    this.moveAlongGeodesic();

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

    const container = this.shadowRoot.querySelector('.siegel-container');
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Update camera aspect ratio
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    // Update renderer size
    this.renderer.setSize(width, height);

    // Re-render if not currently animating
    if (!this.isRunning) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // Add this method to handle component removal from DOM
  disconnectedCallback() {
    // Cleanup when component is removed from DOM
    this.stop();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  // Legacy compatibility for demo
  reset() { this.stop(); }

  setQuantization(newQ) {
    this.quantization = newQ;
    this.angleCalculator.setQuantization(newQ);  // Keep AngleCalculator in sync!
    console.log(`🔧 Quantization set to ${newQ}`);
  }

  setFreezeDuration(milliseconds) {
    this.freezeDuration = Math.max(0, milliseconds);
    console.log(`❄️ Freeze duration set to ${this.freezeDuration}ms (default: 800ms)`);
  }

  get status() {
    const currentSpeedMultiplier = this.bluePath ? this.getSpeedMultiplier(this.bluePath.angularDistance) : 1.0;

    return {
      isRunning: this.isRunning,
      quantization: this.quantization,
      frozenAtC: this.freezeAtC,
      freezeProgress: this.freezeAtC ? (Date.now() - this.freezeStartTime) / this.freezeDuration : 0,
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