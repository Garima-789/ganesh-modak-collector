/**
 * ============================================================================
 * GANESH JI – MODAK COLLECTOR
 * Step 2: Lord Ganesh Ji Player & Smooth Responsive Movement Controls
 * Pure Vanilla JavaScript (Zero external libraries, zero frameworks)
 * ============================================================================
 */

(function () {
  'use strict';

  /**
   * Game Engine Lifecycle States
   */
  const GameState = Object.freeze({
    INIT: 'INIT',
    READY: 'READY',
    RUNNING: 'RUNNING',
    PAUSED: 'PAUSED',
    LEVEL_TRANSITION: 'LEVEL_TRANSITION',
    GAME_OVER: 'GAME_OVER'
  });

  /**
   * Particle System Configuration & Sacred Modes
   */
  const PARTICLE_CONFIG = {
    MAX_PARTICLES: 45 // High performance pool cap (40-50 strictly enforced)
  };

  const PARTICLE_MODES = {
    dust: {
      dustRatio: 0.55,
      dustPalette: ['#fff9c4', '#ffe082', '#ffd54f', '#ffca28', '#ffb300'],
      secondaryPalette: ['#ff8f00', '#ffa726', '#ff6f00', '#f57c00', '#ffb74d'], // marigold petals
      secondaryType: 'petal',
      secondaryVyMin: 0.45,
      secondaryVyMax: 1.1
    },
    lotus: {
      dustRatio: 0.45,
      dustPalette: ['#e0f7fa', '#b2ebf2', '#80deea', '#4dd0e1', '#ffd54f'], // water sparkles
      secondaryPalette: ['#f48fb1', '#f06292', '#e91e63', '#ff80ab', '#fff0f5'], // lotus petals
      secondaryType: 'lotus_petal',
      secondaryVyMin: 0.35,
      secondaryVyMax: 0.85
    },
    leaves: {
      dustRatio: 0.40,
      dustPalette: ['#c8e6c9', '#a5d6a7', '#81c784', '#ffd54f'], // forest motes
      secondaryPalette: ['#4caf50', '#388e3c', '#2e7d32', '#66bb6a', '#81c784'], // sacred leaves
      secondaryType: 'leaf',
      secondaryVyMin: 0.45,
      secondaryVyMax: 1.05
    },
    starlight: {
      dustRatio: 0.65,
      dustPalette: ['#ffffff', '#e0f2fe', '#bae6fd', '#fff59d', '#ffd54f'], // stars
      secondaryPalette: ['#ffd54f', '#ffca28', '#ffa000', '#ff8f00'], // embers
      secondaryType: 'ember',
      secondaryVyMin: -0.3,
      secondaryVyMax: -0.75
    },
    rain: {
      dustRatio: 0.25,
      dustPalette: ['#b3e5fc', '#81d4fa', '#4fc3f7'], // mist motes
      secondaryPalette: ['#81d4fa', '#4fc3f7', '#29b6f6', '#0288d1', '#e1f5fe'], // rain streaks
      secondaryType: 'rain',
      secondaryVyMin: 2.2,
      secondaryVyMax: 3.8
    },
    petals: {
      dustRatio: 0.40,
      dustPalette: ['#fff9c4', '#fce4ec', '#f8bbd9', '#ffd54f'], // dawn dust
      secondaryPalette: ['#f48fb1', '#ff80ab', '#ff4081', '#f06292', '#ffebee'], // rose petals
      secondaryType: 'petal',
      secondaryVyMin: 0.4,
      secondaryVyMax: 0.95
    }
  };

  /**
   * Represents an individual pooled atmospheric particle.
   * Pooled object with zero runtime re-allocations in the animation loop.
   */
  class AtmosphericParticle {
    constructor(category, boundsWidth, boundsHeight, modeName = 'dust') {
      this.category = category; // 'dust' | 'secondary'
      this.modeName = modeName;
      this.type = 'dust';
      this.x = 0;
      this.y = 0;
      this.vx = 0;
      this.vy = 0;
      this.size = 0;
      this.color = '#ffd54f';
      this.alpha = 0.5;
      this.baseAlpha = 0.5;
      this.alphaSpeed = 0.02;
      this.alphaAngle = 0;
      this.rotation = 0;
      this.rotSpeed = 0;
      this.wobble = 0;
      this.wobbleSpeed = 0;

      this.reset(boundsWidth, boundsHeight, true, modeName);
    }

    reset(width, height, initialScatter = false, modeName = this.modeName) {
      this.modeName = modeName;
      const cfg = PARTICLE_MODES[this.modeName] || PARTICLE_MODES.dust;
      this.alphaAngle = Math.random() * Math.PI * 2;
      this.wobble = Math.random() * Math.PI * 2;

      if (this.category === 'dust') {
        this.type = 'dust';
        this.size = 1.2 + Math.random() * 2.2;
        this.color = cfg.dustPalette[Math.floor(Math.random() * cfg.dustPalette.length)];
        this.baseAlpha = 0.25 + Math.random() * 0.55;
        this.alphaSpeed = 0.015 + Math.random() * 0.025;
        this.vx = (Math.random() - 0.5) * 0.35;
        this.vy = -0.18 - Math.random() * 0.38;

        this.x = Math.random() * width;
        this.y = initialScatter ? Math.random() * height : height + 10;
      } else {
        this.type = cfg.secondaryType;
        this.color = cfg.secondaryPalette[Math.floor(Math.random() * cfg.secondaryPalette.length)];

        if (this.type === 'rain') {
          this.size = 6.0 + Math.random() * 6.0;
          this.baseAlpha = 0.45 + Math.random() * 0.35;
          this.alpha = this.baseAlpha;
          this.vx = -0.5 - Math.random() * 0.5;
          this.vy = cfg.secondaryVyMin + Math.random() * (cfg.secondaryVyMax - cfg.secondaryVyMin);
          this.x = Math.random() * (width + 40);
          this.y = initialScatter ? Math.random() * height : -20;
        } else if (this.type === 'ember') {
          this.size = 2.0 + Math.random() * 2.5;
          this.baseAlpha = 0.5 + Math.random() * 0.4;
          this.alpha = this.baseAlpha;
          this.alphaSpeed = 0.02 + Math.random() * 0.03;
          this.wobbleSpeed = 0.02 + Math.random() * 0.03;
          this.vx = (Math.random() - 0.5) * 0.4;
          this.vy = cfg.secondaryVyMin - Math.random() * 0.45; // drifts upwards
          this.x = Math.random() * width;
          this.y = initialScatter ? Math.random() * height : height + 10;
        } else if (this.type === 'leaf') {
          this.size = 4.5 + Math.random() * 4.5;
          this.baseAlpha = 0.6 + Math.random() * 0.35;
          this.alpha = this.baseAlpha;
          this.rotation = Math.random() * Math.PI * 2;
          this.rotSpeed = (Math.random() - 0.5) * 0.03;
          this.wobbleSpeed = 0.02 + Math.random() * 0.025;
          this.vx = (Math.random() - 0.5) * 0.4;
          this.vy = cfg.secondaryVyMin + Math.random() * (cfg.secondaryVyMax - cfg.secondaryVyMin);
          this.x = Math.random() * width;
          this.y = initialScatter ? Math.random() * height : -15;
        } else {
          // 'petal' and 'lotus_petal'
          this.size = 5.0 + Math.random() * 5.0;
          this.baseAlpha = 0.6 + Math.random() * 0.35;
          this.alpha = this.baseAlpha;
          this.rotation = Math.random() * Math.PI * 2;
          this.rotSpeed = (Math.random() - 0.5) * 0.035;
          this.wobbleSpeed = 0.02 + Math.random() * 0.03;
          this.vx = (Math.random() - 0.5) * 0.45;
          this.vy = cfg.secondaryVyMin + Math.random() * (cfg.secondaryVyMax - cfg.secondaryVyMin);
          this.x = Math.random() * width;
          this.y = initialScatter ? Math.random() * height : -15;
        }
      }
    }

    update(width, height) {
      this.wobble += this.wobbleSpeed;

      if (this.type === 'dust') {
        this.x += this.vx + Math.sin(this.wobble) * 0.25;
        this.y += this.vy;
        this.alphaAngle += this.alphaSpeed;
        this.alpha = Math.max(0.05, this.baseAlpha + Math.sin(this.alphaAngle) * 0.2);

        if (this.y < -15 || this.x < -20 || this.x > width + 20) {
          this.reset(width, height, false);
        }
      } else if (this.type === 'ember') {
        this.x += this.vx + Math.sin(this.wobble) * 0.35;
        this.y += this.vy;
        this.alphaAngle += this.alphaSpeed;
        this.alpha = Math.max(0.1, this.baseAlpha + Math.sin(this.alphaAngle) * 0.3);

        if (this.y < -15 || this.x < -20 || this.x > width + 20) {
          this.reset(width, height, false);
        }
      } else if (this.type === 'rain') {
        this.x += this.vx;
        this.y += this.vy;

        if (this.y > height + 25 || this.x < -25) {
          this.reset(width, height, false);
        }
      } else {
        // Petals and Leaves
        this.x += this.vx + Math.cos(this.wobble) * 0.5;
        this.y += this.vy;
        this.rotation += this.rotSpeed;

        if (this.y > height + 20 || this.x < -20 || this.x > width + 20) {
          this.reset(width, height, false);
        }
      }
    }

    reconfigure(category, width, height, modeName = this.modeName, initialScatter = false) {
      this.category = category;
      this.modeName = modeName;
      this.reset(width, height, initialScatter, modeName);
    }

    render(ctx) {
      if (this.type === 'dust') {
        const px = (this.x + 0.5) | 0;
        const py = (this.y + 0.5) | 0;
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(px, py, this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = this.alpha * 0.35;
        ctx.beginPath();
        ctx.arc(px, py, this.size * 2.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.type === 'ember') {
        const px = (this.x + 0.5) | 0;
        const py = (this.y + 0.5) | 0;
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(px, py, this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = this.alpha * 0.45;
        ctx.beginPath();
        ctx.arc(px, py, this.size * 2.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.type === 'rain') {
        ctx.globalAlpha = this.alpha;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo((this.x + 0.5) | 0, (this.y + 0.5) | 0);
        ctx.lineTo(((this.x + this.vx * 2.5) + 0.5) | 0, ((this.y + this.size * 1.5) + 0.5) | 0);
        ctx.stroke();
      } else if (this.type === 'leaf') {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        const flutterScale = 0.5 + Math.abs(Math.sin(this.wobble)) * 0.5;
        ctx.scale(flutterScale, 1);

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.bezierCurveTo(this.size * 0.7, -this.size * 0.3, this.size * 0.6, this.size * 0.6, 0, this.size);
        ctx.bezierCurveTo(-this.size * 0.6, this.size * 0.6, -this.size * 0.7, -this.size * 0.3, 0, -this.size);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(0, -this.size * 0.85);
        ctx.lineTo(0, this.size * 0.85);
        ctx.stroke();
        ctx.restore();
      } else {
        // Petals (Marigold & Lotus)
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        const flutterScale = 0.4 + Math.abs(Math.sin(this.wobble)) * 0.6;
        ctx.scale(flutterScale, 1);

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.bezierCurveTo(this.size * 0.6, -this.size * 0.4, this.size * 0.7, this.size * 0.5, 0, this.size);
        ctx.bezierCurveTo(-this.size * 0.7, this.size * 0.5, -this.size * 0.6, -this.size * 0.4, 0, -this.size);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = this.type === 'lotus_petal' ? 'rgba(255, 240, 245, 0.55)' : 'rgba(255, 245, 157, 0.45)';
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        ctx.moveTo(0, -this.size * 0.8);
        ctx.lineTo(0, this.size * 0.7);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  /**
   * Atmospheric Particle System Engine (Step 13: Object Pool Reuse)
   */
  class ParticleSystem {
    constructor(canvasElement) {
      this.canvas = canvasElement;
      this.ctx = canvasElement.getContext('2d');
      this.pool = [];
      this.width = 0;
      this.height = 0;
      this.dpr = 1;
      this.animId = null;
      this.isRunning = false;
      this.prefersReducedMotion = false;
      this.currentMode = 'dust';

      this.init();
    }

    init() {
      if (!this.canvas || !this.ctx) return;

      this.checkReducedMotion();
      this.updateDimensions();
      this.populatePool(this.currentMode);
    }

    checkReducedMotion() {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.prefersReducedMotion = mediaQuery.matches;

      mediaQuery.addEventListener('change', (e) => {
        this.prefersReducedMotion = e.matches;
        if (this.prefersReducedMotion) this.clear();
      });
    }

    updateDimensions() {
      const rect = this.canvas.getBoundingClientRect();
      this.width = Math.max(rect.width, 320);
      this.height = Math.max(rect.height, 240);
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);

      this.canvas.width = Math.floor(this.width * this.dpr);
      this.canvas.height = Math.floor(this.height * this.dpr);

      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    populatePool(mode = 'dust') {
      const cfg = PARTICLE_MODES[mode] || PARTICLE_MODES.dust;
      const total = PARTICLE_CONFIG.MAX_PARTICLES;
      const dustCount = Math.floor(total * cfg.dustRatio);
      const secondaryCount = total - dustCount;

      if (this.pool.length === 0) {
        for (let i = 0; i < dustCount; i++) {
          this.pool.push(new AtmosphericParticle('dust', this.width, this.height, mode));
        }
        for (let i = 0; i < secondaryCount; i++) {
          this.pool.push(new AtmosphericParticle('secondary', this.width, this.height, mode));
        }
      } else {
        // In-place object reuse: zero garbage collection allocation!
        for (let i = 0; i < dustCount; i++) {
          this.pool[i].reconfigure('dust', this.width, this.height, mode, true);
        }
        for (let i = dustCount; i < total; i++) {
          this.pool[i].reconfigure('secondary', this.width, this.height, mode, true);
        }
      }
    }

    setMode(modeName) {
      if (!PARTICLE_MODES[modeName]) return;
      this.currentMode = modeName;
      this.populatePool(modeName);
    }

    start() {
      if (this.isRunning) return;
      this.isRunning = true;
      this.loop = this.loop.bind(this);
      this.animId = requestAnimationFrame(this.loop);
    }

    pause() {
      this.isRunning = false;
      if (this.animId) {
        cancelAnimationFrame(this.animId);
        this.animId = null;
      }
    }

    clear() {
      if (this.ctx) {
        this.ctx.clearRect(0, 0, this.width, this.height);
      }
    }

    loop() {
      if (!this.isRunning) return;

      if (this.prefersReducedMotion) {
        this.clear();
        this.animId = requestAnimationFrame(this.loop);
        return;
      }

      this.ctx.clearRect(0, 0, this.width, this.height);

      for (let i = 0; i < this.pool.length; i++) {
        const p = this.pool[i];
        p.update(this.width, this.height);
        p.render(this.ctx);
      }
      this.ctx.globalAlpha = 1.0;

      this.animId = requestAnimationFrame(this.loop);
    }

    onResize() {
      this.updateDimensions();
      for (let i = 0; i < this.pool.length; i++) {
        this.pool[i].reset(this.width, this.height, true, this.currentMode);
      }
    }
  }

  /**
   * Input Manager
   * Handles keyboard (Arrow keys, A/D) and mobile pointer/touch controls.
   */
  class InputManager {
    constructor() {
      this.keys = {
        left: false,
        right: false
      };
      this.touchLeft = false;
      this.touchRight = false;

      this.bindKeyboard();
      this.bindTouchControls();
    }

    bindKeyboard() {
      window.addEventListener('keydown', (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          this.keys.left = true;
          e.preventDefault();
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          this.keys.right = true;
          e.preventDefault();
        }
      });

      window.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          this.keys.left = false;
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          this.keys.right = false;
        }
      });

      // Clear on blur/focus loss
      window.addEventListener('blur', () => {
        this.reset();
      });
    }

    bindTouchControls() {
      const btnLeft = document.getElementById('btn-touch-left');
      const btnRight = document.getElementById('btn-touch-right');
      const btnAction = document.getElementById('btn-touch-action');

      const bindButton = (btn, setTouchState) => {
        if (!btn) return;
        const start = (e) => {
          e.preventDefault();
          setTouchState(true);
          btn.classList.add('is-pressed');
        };
        const end = (e) => {
          e.preventDefault();
          setTouchState(false);
          btn.classList.remove('is-pressed');
        };

        btn.addEventListener('pointerdown', start);
        btn.addEventListener('pointerup', end);
        btn.addEventListener('pointercancel', end);
        btn.addEventListener('pointerleave', end);
      };

      if (btnLeft) bindButton(btnLeft, (val) => { this.touchLeft = val; });
      if (btnRight) bindButton(btnRight, (val) => { this.touchRight = val; });
      if (btnAction) {
        bindButton(btnAction, (val) => {
          this.touchAction = val;
          if (val) {
            // Devotional prayer aura burst on action button tap
            const playerEl = document.getElementById('ganesh-player');
            if (playerEl) {
              playerEl.classList.add('is-celebrating');
              setTimeout(() => { playerEl.classList.remove('is-celebrating'); }, 400);
            }
          }
        });
      }

      // Prevent touch controls from sticking if released outside button
      window.addEventListener('pointerup', () => {
        this.touchLeft = false;
        this.touchRight = false;
        this.touchAction = false;
        if (btnLeft) btnLeft.classList.remove('is-pressed');
        if (btnRight) btnRight.classList.remove('is-pressed');
        if (btnAction) btnAction.classList.remove('is-pressed');
      });
      window.addEventListener('pointercancel', () => {
        this.reset();
      });
    }

    getHorizontalAxis() {
      let axis = 0;
      if (this.keys.left || this.touchLeft) axis -= 1;
      if (this.keys.right || this.touchRight) axis += 1;
      return axis;
    }

    reset() {
      this.keys.left = false;
      this.keys.right = false;
      this.touchLeft = false;
      this.touchRight = false;
      this.touchAction = false;

      const btnLeft = document.getElementById('btn-touch-left');
      const btnRight = document.getElementById('btn-touch-right');
      const btnAction = document.getElementById('btn-touch-action');
      if (btnLeft) btnLeft.classList.remove('is-pressed');
      if (btnRight) btnRight.classList.remove('is-pressed');
      if (btnAction) btnAction.classList.remove('is-pressed');
    }
  }

  /**
   * Ganesh Player Controller (Step 2 & Integrated)
   * Controls Ganesh Ji's position, horizontal movement, boundary constraints,
   * facing direction, animations, and hitbox generation.
   */
  class GaneshPlayer {
    constructor(element, arena) {
      this.element = element;
      this.image = element ? (element.querySelector('.ganesh-player-image') || document.getElementById('ganesh-image')) : null;
      this.arena = arena;
      this.x = 0;
      this.vx = 0;      // Current horizontal velocity for smooth acceleration & stopping
      this.width = 120;
      this.height = 160;
      this.arenaH = 600;
      this.speed = 390; // Pixels per second (increased ~22% for noticeably more responsive movement)
      this.facing = 1;  // 1 = right, -1 = left
      this.isMoving = false;
      this.minX = 0;
      this.maxX = 0;

      this.recalculateBounds();
      // Center initially
      this.x = (this.minX + this.maxX) / 2;
      this.render();
    }

    recalculateBounds() {
      if (!this.arena || !this.element) return;
      const arenaWidth = this.arena.clientWidth || (this.arena.parentElement ? this.arena.parentElement.clientWidth : 800) || 800;
      this.width = this.element.offsetWidth || 120;
      this.height = this.element.offsetHeight || 160;
      this.arenaH = this.arena.clientHeight || (this.arena.parentElement ? this.arena.parentElement.clientHeight : 600) || 600;

      this.minX = 0;
      this.maxX = Math.max(200, arenaWidth - this.width);

      // Clamp x within new boundaries
      this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
    }

    getHitbox() {
      if (!this.element || !this.arena) {
        return { x: 0, y: 0, width: 0, height: 0 };
      }
      const playerW = this.width;
      const playerH = this.height || 160;
      const arenaH = this.arenaH || 600;

      // Catching hitbox focused on Ganesh Ji's core body & upper torso/hands (fair, slightly smaller than visible bounds)
      return {
        x: this.x + playerW * 0.15,
        y: arenaH - playerH * 0.90,
        width: playerW * 0.70,
        height: playerH * 0.85
      };
    }

    moveLeft() {
      this.facing = -1;
      this.isMoving = true;
    }

    moveRight() {
      this.facing = 1;
      this.isMoving = true;
    }

    stop() {
      this.vx = 0;
      this.isMoving = false;
    }

    update(dt, inputAxis, speedMultiplier = 1.0) {
      const targetVx = inputAxis * this.speed * speedMultiplier;

      if (inputAxis !== 0) {
        this.facing = inputAxis > 0 ? 1 : -1;
        // Snappy, instant-feeling response with micro-smoothing (~35ms reaction, zero perceptible delay)
        this.vx += (targetVx - this.vx) * Math.min(1, dt * 26);
      } else {
        // Smooth deceleration on key/button release without abrupt cutoff or jitter
        this.vx += (0 - this.vx) * Math.min(1, dt * 22);
        if (Math.abs(this.vx) < 3) this.vx = 0;
      }

      if (this.maxX <= this.minX && this.arena && this.arena.clientWidth > 0) {
        this.recalculateBounds();
      }

      this.x += this.vx * dt;

      // Boundary constraints: strictly within arena
      if (this.x < this.minX) {
        this.x = this.minX;
        this.vx = 0;
      }
      if (this.x > this.maxX) {
        this.x = this.maxX;
        this.vx = 0;
      }

      this.isMoving = Math.abs(this.vx) > 4;
      this.render();
    }

    setSwiftEffect(active) {
      if (!this.element) return;
      if (active) {
        this.element.classList.add('has-swift-aura');
      } else {
        this.element.classList.remove('has-swift-aura');
      }
    }

    setMagnetEffect(active) {
      if (!this.element) return;
      if (active) {
        this.element.classList.add('has-magnet-aura');
      } else {
        this.element.classList.remove('has-magnet-aura');
      }
    }

    setPowerStage(stage) {
      if (!this.element) return;
      for (let i = 1; i <= 5; i++) {
        this.element.classList.remove(`power-stage-${i}`);
      }
      this.element.classList.add(`power-stage-${stage}`);
    }

    setFlowerAttraction(active) {
      if (!this.element) return;
      const flowerRing = document.getElementById('ganesh-flower-aura');
      if (active) {
        this.element.classList.add('has-flower-aura');
        if (flowerRing) flowerRing.classList.remove('is-hidden');
      } else {
        this.element.classList.remove('has-flower-aura');
        if (flowerRing) flowerRing.classList.add('is-hidden');
      }
    }

    render() {
      if (!this.element) return;

      // Directional facing classes
      if (this.facing === 1) {
        this.element.classList.remove('facing-left');
        this.element.classList.add('facing-right');
      } else {
        this.element.classList.remove('facing-right');
        this.element.classList.add('facing-left');
      }

      // Idle vs Walking motion classes
      if (this.isMoving) {
        this.element.classList.remove('is-idle');
        this.element.classList.add('is-walking');
      } else {
        this.element.classList.remove('is-walking');
        this.element.classList.add('is-idle');
      }

      // Hardware accelerated translation on root container
      this.element.style.transform = `translate3d(${this.x.toFixed(1)}px, 0, 0)`;
    }

    onResize(oldArenaWidth) {
      const prevRatio = oldArenaWidth > 0 ? this.x / Math.max(1, oldArenaWidth - this.width) : 0.5;
      this.recalculateBounds();
      // Preserve relative horizontal percentage
      this.x = this.minX + prevRatio * (this.maxX - this.minX);
      this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
      this.render();
    }

    resetPosition() {
      this.recalculateBounds();
      this.x = (this.minX + this.maxX) / 2;
      this.vx = 0;
      this.facing = 1;
      this.isMoving = false;
      this.setSwiftEffect(false);
      this.setMagnetEffect(false);
      this.setPowerStage(1);
      this.setFlowerAttraction(false);
      this.render();
    }

    reset() {
      this.resetPosition();
    }
  }

  /**
   * Mushak Manager - Lord Ganesha's Sacred Mouse Companion & Helper
   * Runs alongside Ganesh Ji, follows his movement, and periodically
   * dashes across the arena to catch falling modaks/ladoos before they hit the ground!
   */
  class MushakManager {
    constructor(element, player, scoreManager, modakManager, ladooManager) {
      this.element = element;
      this.player = player;
      this.scoreManager = scoreManager;
      this.modakManager = modakManager;
      this.ladooManager = ladooManager;

      this.x = 0;
      this.facing = 1; // 1 = right, -1 = left
      this.state = 'FOLLOWING'; // 'FOLLOWING', 'DASHING', 'RETURNING'
      this.helperTimer = 6; // First helper catch after 6 seconds
      this.helperInterval = 15; // Then every 15 seconds
      this.targetSweet = null;
      this.speechEl = document.getElementById('mushak-speech');
      this.speechTimeout = null;

      this.reset();
    }

    reset() {
      this.state = 'FOLLOWING';
      this.targetSweet = null;
      this.helperTimer = 6;
      if (this.player) {
        this.x = this.player.x + 52;
        this.facing = this.player.facing || 1;
      }
      if (this.speechEl) {
        this.speechEl.classList.add('is-hidden');
      }
      if (this.element) {
        this.element.classList.remove('is-scampering', 'is-dashing');
      }
      this.render();
    }

    update(dt, arenaW, arenaH) {
      if (!this.element || !this.player) return;

      if (this.state === 'FOLLOWING') {
        this.helperTimer -= dt;

        // Follow Ganesh Ji smoothly at his side
        const targetX = this.player.x + (this.player.facing > 0 ? 52 : -52);
        const dx = targetX - this.x;
        const speed = Math.abs(dx) * 8.0;
        this.x += (dx >= 0 ? 1 : -1) * Math.min(Math.abs(dx), Math.max(speed, 60) * dt);
        this.facing = this.player.facing || 1;

        const isMoving = Math.abs(dx) > 3 || (this.player.isMoving);
        this.element.classList.toggle('is-scampering', isMoving);

        // Check if ready for helper seva
        if (this.helperTimer <= 0) {
          this.findTargetSweet(arenaW, arenaH);
        }
      } else if (this.state === 'DASHING') {
        if (!this.targetSweet || !this.targetSweet.active) {
          this.state = 'RETURNING';
          return;
        }

        const targetX = this.targetSweet.x;
        const dx = targetX - this.x;
        this.facing = dx >= 0 ? 1 : -1;
        const dashSpeed = 560; // fast dash to intercept
        const moveDist = dashSpeed * dt;

        if (Math.abs(dx) <= moveDist || Math.abs(dx) < 32) {
          this.x = targetX;
          this.catchSweet();
        } else {
          this.x += (dx >= 0 ? 1 : -1) * moveDist;
        }

        this.element.classList.add('is-dashing');
      } else if (this.state === 'RETURNING') {
        const targetX = this.player.x + (this.player.facing > 0 ? 52 : -52);
        const dx = targetX - this.x;
        this.facing = dx >= 0 ? 1 : -1;
        const returnSpeed = 440;
        const moveDist = returnSpeed * dt;

        if (Math.abs(dx) <= moveDist || Math.abs(dx) < 18) {
          this.x = targetX;
          this.state = 'FOLLOWING';
          this.helperTimer = this.helperInterval;
          this.element.classList.remove('is-dashing');
        } else {
          this.x += (dx >= 0 ? 1 : -1) * moveDist;
        }
      }

      this.render();
    }

    findTargetSweet(arenaW, arenaH) {
      let lowestSweet = null;
      let highestY = 0;

      // Scan active modaks
      if (this.modakManager && this.modakManager.modaks) {
        for (const m of this.modakManager.modaks) {
          if (m.active && m.y > highestY && m.y > 160 && m.y < arenaH - 60) {
            highestY = m.y;
            lowestSweet = m;
          }
        }
      }

      // Scan active ladoos
      if (this.ladooManager && this.ladooManager.ladoos) {
        for (const l of this.ladooManager.ladoos) {
          if (l.active && l.y > highestY && l.y > 160 && l.y < arenaH - 60) {
            highestY = l.y;
            lowestSweet = l;
          }
        }
      }

      if (lowestSweet) {
        this.targetSweet = lowestSweet;
        this.state = 'DASHING';
        this.showSpeech('🐁 Mushak Seva!');
      } else {
        // Try again shortly if no falling sweets on screen yet
        this.helperTimer = 3.0;
      }
    }

    catchSweet() {
      if (!this.targetSweet || !this.targetSweet.active) {
        this.state = 'RETURNING';
        return;
      }

      const sweet = this.targetSweet;
      sweet.active = false;
      if (sweet.element) {
        sweet.element.classList.add('is-collected');
        setTimeout(() => {
          if (sweet && sweet.element) sweet.element.remove();
        }, 300);
      }

      const isLadoo = sweet.type === 'ladoo';
      if (this.scoreManager) {
        this.scoreManager.score += 15;
        if (isLadoo) {
          this.scoreManager.ladoosCollected += 1;
        } else {
          this.scoreManager.modaksCollected += 1;
        }
        this.scoreManager.render();
      }

      this.showSpeech('✨ +15 Seva! ✨');
      this.targetSweet = null;
      this.state = 'RETURNING';
    }

    showSpeech(text) {
      if (!this.speechEl) return;
      this.speechEl.textContent = text;
      this.speechEl.classList.remove('is-hidden');
      if (this.speechTimeout) clearTimeout(this.speechTimeout);
      this.speechTimeout = setTimeout(() => {
        if (this.speechEl) this.speechEl.classList.add('is-hidden');
      }, 1600);
    }

    render() {
      if (!this.element) return;
      this.element.style.transform = `translate3d(${this.x.toFixed(1)}px, 0, 0) scaleX(${this.facing})`;
    }
  }

  /**
   * Score Manager (Step 3 & Step 8)
   * Tracks score points, modaks collected, and ladoos collected count,
   * updating HUD badges with celebratory pulse responses.
   */
  class ScoreManager {
    constructor() {
      this.score = 0;
      this.modaksCollected = 0;
      this.ladoosCollected = 0;
      this.scoreEl = document.getElementById('hud-score');
      this.modakCountEl = document.getElementById('hud-modak-count');
      this.ladooCountEl = document.getElementById('hud-ladoo-count');
      this.scoreBadge = document.querySelector('.hud-score-badge');
      this.modakBadge = document.querySelector('.hud-modak-badge');
      this.ladooBadge = document.getElementById('hud-ladoo-badge');
    }

    addPoints(points) {
      this.score += points;
      this.modaksCollected += 1;
      this.render();
    }

    addLadoo(points = 5) {
      this.score += points;
      this.ladoosCollected += 1;
      this.renderLadoo();
    }

    render() {
      if (this.scoreEl) {
        this.scoreEl.textContent = String(this.score);
        this.scoreEl.classList.remove('num-pop');
        void this.scoreEl.offsetWidth;
        this.scoreEl.classList.add('num-pop');
      }
      if (this.modakCountEl) {
        this.modakCountEl.textContent = String(this.modaksCollected);
        this.modakCountEl.classList.remove('num-pop');
        void this.modakCountEl.offsetWidth;
        this.modakCountEl.classList.add('num-pop');
      }
      if (this.ladooCountEl) {
        this.ladooCountEl.textContent = String(this.ladoosCollected);
      }

      if (this.scoreBadge) {
        this.scoreBadge.classList.remove('hud-pulse');
        void this.scoreBadge.offsetWidth;
        this.scoreBadge.classList.add('hud-pulse');
      }
      if (this.modakBadge) {
        this.modakBadge.classList.remove('hud-pulse');
        void this.modakBadge.offsetWidth;
        this.modakBadge.classList.add('hud-pulse');
      }
    }

    renderLadoo() {
      if (this.scoreEl) {
        this.scoreEl.textContent = String(this.score);
        this.scoreEl.classList.remove('num-pop');
        void this.scoreEl.offsetWidth;
        this.scoreEl.classList.add('num-pop');
      }
      if (this.ladooCountEl) {
        this.ladooCountEl.textContent = String(this.ladoosCollected);
        this.ladooCountEl.classList.remove('num-pop');
        void this.ladooCountEl.offsetWidth;
        this.ladooCountEl.classList.add('num-pop');
      }

      if (this.scoreBadge) {
        this.scoreBadge.classList.remove('hud-pulse');
        void this.scoreBadge.offsetWidth;
        this.scoreBadge.classList.add('hud-pulse');
      }
      if (this.ladooBadge) {
        this.ladooBadge.classList.remove('hud-pulse');
        void this.ladooBadge.offsetWidth;
        this.ladooBadge.classList.add('hud-pulse');
      }
    }

    getScore() {
      return this.score;
    }

    getModaksCollected() {
      return this.modaksCollected;
    }

    reset() {
      this.score = 0;
      this.modaksCollected = 0;
      this.ladoosCollected = 0;
      if (this.scoreEl) {
        this.scoreEl.textContent = '0';
        this.scoreEl.classList.remove('num-pop');
      }
      if (this.modakCountEl) {
        this.modakCountEl.textContent = '0';
        this.modakCountEl.classList.remove('num-pop');
      }
      if (this.ladooCountEl) {
        this.ladooCountEl.textContent = '0';
        this.ladooCountEl.classList.remove('num-pop');
      }
    }
  }

  /**
   * Lives Manager (Step 5 & 11)
   * Tracks player lives (starting with 3), renders heart icons + accessible count,
   * handles obstacle life loss, warning animation at 1 life, and triggers game-over callback.
   */
  class LivesManager {
    constructor(maxLives = 3, onGameOver = null) {
      this.maxLives = maxLives;
      this.lives = maxLives;
      this.prevLives = maxLives;
      this.onGameOver = onGameOver;
      this.heartsEl = document.getElementById('hud-lives-hearts');
      this.countEl = document.getElementById('hud-lives-count');
      this.badgeEl = document.getElementById('hud-lives-badge');
      this.render(false);
    }

    getLives() {
      return this.lives;
    }

    getMaxLives() {
      return this.maxLives;
    }

    loseLife() {
      if (this.lives <= 0) return;
      this.prevLives = this.lives;
      this.lives -= 1;
      this.render(true);

      if (this.isGameOver() && typeof this.onGameOver === 'function') {
        this.onGameOver();
      }
    }

    reset() {
      this.lives = this.maxLives;
      this.prevLives = this.maxLives;
      this.render(false);
    }

    isGameOver() {
      return this.lives <= 0;
    }

    render(triggerPulse = false) {
      if (this.countEl) {
        this.countEl.textContent = String(this.lives);
      }
      if (this.heartsEl) {
        let html = '';
        for (let i = 0; i < this.maxLives; i++) {
          const isActive = i < this.lives;
          const isWarning = isActive && this.lives === 1;
          const justLost = !isActive && i === this.lives && triggerPulse;
          const classes = [
            'heart-icon',
            isActive ? 'active' : 'spent',
            isWarning ? 'heart-warning-pulse' : '',
            justLost ? 'lost' : ''
          ].filter(Boolean).join(' ');
          html += `<span class="${classes}" aria-hidden="true">${isActive ? '❤️' : '🤍'}</span>`;
        }
        this.heartsEl.innerHTML = html;
      }
      if (this.badgeEl) {
        this.badgeEl.setAttribute('aria-label', `Lives: ${this.lives} of ${this.maxLives}`);
        if (this.lives === 1) {
          this.badgeEl.classList.add('low-lives');
        } else {
          this.badgeEl.classList.remove('low-lives');
        }
        if (triggerPulse) {
          this.badgeEl.classList.remove('hud-miss-pulse');
          void this.badgeEl.offsetWidth;
          this.badgeEl.classList.add('hud-miss-pulse');
        }
      }
    }
  }

  /**
   * Game Engine Global Configuration (Step 6)
   */
  const GAME_CONFIG = {
    roundDuration: 60 // Round duration in seconds (configurable)
  };

  /**
   * Level Configuration (Step 8)
   */
  const LEVEL_CONFIG = {
    startingLevel: 1,
    maxLevel: 5,
    targets: [10, 15, 20, 25, 30] // Target successfully collected modaks per level
  };

  /**
   * Combo & Streak Configuration (Step 6)
   */
  const COMBO_CONFIG = {
    enabled: true,
    bonusEvery: 3,    // Awards bonus every 3 consecutive modaks (3, 6, 9, ...)
    bonusAmount: 5    // +5 bonus devotional points
  };

  /**
   * Timer Manager (Step 6)
   * Tracks round countdown time (60s default), updates HUD badge,
   * triggers gentle amber/gold warning pulse at <= 10s, and invokes onTimeUp callback when complete.
   */
  class TimerManager {
    constructor(duration = GAME_CONFIG.roundDuration, onTimeUp = null) {
      this.initialDuration = duration;
      this.remainingTime = duration;
      this.onTimeUp = onTimeUp;
      this.isRunning = false;
      this.timeAccumulator = 0;
      this.badgeEl = document.getElementById('hud-timer-badge');
      this.valueEl = document.getElementById('hud-timer-value');
      this.render();
    }

    start() {
      this.isRunning = true;
    }

    pause() {
      this.isRunning = false;
    }

    resume() {
      this.isRunning = true;
    }

    reset() {
      this.remainingTime = this.initialDuration;
      this.timeAccumulator = 0;
      this.isRunning = false;
      this.render();
    }

    update(dt) {
      if (!this.isRunning || this.remainingTime <= 0) return;

      this.timeAccumulator += dt;
      if (this.timeAccumulator >= 1.0) {
        const secondsToDeduct = Math.floor(this.timeAccumulator);
        this.timeAccumulator -= secondsToDeduct;
        this.remainingTime = Math.max(0, this.remainingTime - secondsToDeduct);
        this.render();

        if (this.remainingTime <= 0) {
          this.isRunning = false;
          if (typeof this.onTimeUp === 'function') {
            this.onTimeUp('time_up');
          }
        }
      }
    }

    render() {
      if (this.valueEl) {
        this.valueEl.textContent = String(Math.ceil(this.remainingTime));
      }
      if (this.badgeEl) {
        this.badgeEl.setAttribute('aria-label', `Time Remaining: ${Math.ceil(this.remainingTime)} seconds`);
        if (this.remainingTime <= 10 && this.remainingTime > 0) {
          this.badgeEl.classList.add('is-warning');
        } else {
          this.badgeEl.classList.remove('is-warning');
        }
      }
    }
  }

  /**
   * Level Manager (Step 8)
   * Controls the current gameplay level (1 to 5), per-level collection target tracking,
   * level transition callbacks, and HUD level status updates.
   */
  class LevelManager {
    constructor(onLevelComplete = null, onFinalComplete = null) {
      this.startingLevel = LEVEL_CONFIG.startingLevel;
      this.maxLevel = LEVEL_CONFIG.maxLevel;
      this.targets = LEVEL_CONFIG.targets;

      this.currentLevel = this.startingLevel;
      this.levelModaksCollected = 0;
      this.onLevelComplete = onLevelComplete;
      this.onFinalComplete = onFinalComplete;

      this.badgeEl = document.getElementById('hud-level-badge');
      this.valueEl = document.getElementById('hud-level-value');
      this.updateHUD();
    }

    getCurrentLevel() {
      return this.currentLevel;
    }

    getTarget(level = this.currentLevel) {
      const idx = Math.max(0, Math.min(level - 1, this.targets.length - 1));
      return this.targets[idx];
    }

    getLevelModaks() {
      return this.levelModaksCollected;
    }

    /**
     * Called whenever player successfully collects a Modak.
     * Note: Only successfully collected modaks increment this (missed modaks do not count).
     */
    registerModakCollected() {
      this.levelModaksCollected += 1;
      const target = this.getTarget();

      if (this.levelModaksCollected >= target) {
        if (this.currentLevel < this.maxLevel) {
          if (typeof this.onLevelComplete === 'function') {
            this.onLevelComplete(this.currentLevel, this.levelModaksCollected, this.currentLevel + 1);
          }
        } else {
          if (typeof this.onFinalComplete === 'function') {
            this.onFinalComplete();
          }
        }
      }
    }

    advanceLevel() {
      if (this.currentLevel < this.maxLevel) {
        this.currentLevel += 1;
        this.levelModaksCollected = 0;
        this.updateHUD();
        this.pulseHUD();
      }
    }

    updateHUD() {
      if (this.valueEl) {
        this.valueEl.textContent = String(this.currentLevel);
      }
      if (this.badgeEl) {
        this.badgeEl.setAttribute('aria-label', `Level: ${this.currentLevel} of ${this.maxLevel}`);
      }
    }

    pulseHUD() {
      if (this.badgeEl) {
        this.badgeEl.classList.remove('is-level-up');
        void this.badgeEl.offsetWidth;
        this.badgeEl.classList.add('is-level-up');
        setTimeout(() => {
          if (this.badgeEl) this.badgeEl.classList.remove('is-level-up');
        }, 1500);
      }
    }

    reset() {
      this.currentLevel = this.startingLevel;
      this.levelModaksCollected = 0;
      this.updateHUD();
    }
  }

  /**
   * Sacred Environments Configuration (Steps 8-10)
   * 6 Sacred Temple Surroundings with progressive score thresholds, minimum dwell times,
   * distinctive color identities, particle modes, and devotional toasts.
   */
  const ENVIRONMENTS = [
    {
      id: 'day-temple',
      bgUrl: 'assets/bg_day_temple.jpg',
      className: 'env-temple-courtyard',
      name: 'Day – Temple Courtyard',
      minScore: 0,
      icon: '🛕',
      particleMode: 'dust',
      toastTitle: 'DAY – TEMPLE COURTYARD',
      description: 'Sacred Daytime Temple Courtyard with Carved Stone Pillars'
    },
    {
      id: 'evening-riverside',
      bgUrl: 'assets/bg_evening_riverside.jpg',
      className: 'env-lotus-lake',
      name: 'Evening – Riverside',
      minScore: 100,
      icon: '🌅',
      particleMode: 'dust',
      toastTitle: 'EVENING – RIVERSIDE',
      description: 'Sacred Evening River Ghat & Sunset Glow'
    },
    {
      id: 'night-festival',
      bgUrl: 'assets/bg_night_festival.jpg',
      className: 'env-festival-night',
      name: 'Night – Festival Lights',
      minScore: 240,
      icon: '🌙',
      particleMode: 'starlight',
      toastTitle: 'NIGHT – FESTIVAL LIGHTS',
      description: 'Midnight Ghat with Glowing Diyas & Festival Illumination'
    },
    {
      id: 'monsoon-temple',
      bgUrl: 'assets/bg_monsoon_temple.jpg',
      className: 'env-monsoon-temple',
      name: 'Monsoon – Rainy Temple',
      minScore: 420,
      icon: '🌧️',
      particleMode: 'rain',
      toastTitle: 'MONSOON – RAINY TEMPLE',
      description: 'Gentle Cooling Rain & Sacred Temple Sanctuary'
    },
    {
      id: 'blossom-garden',
      bgUrl: 'assets/bg_blossom_garden.jpg',
      className: 'env-blossom-garden',
      name: 'Spring – Blossom Garden',
      minScore: 650,
      icon: '🌸',
      particleMode: 'petals',
      toastTitle: 'SPRING – BLOSSOM GARDEN',
      description: 'Sacred Spring Garden of Parijat & Rose Blossoms'
    }
  ];

  const ENVIRONMENT_CONFIG = {
    cycleIntervalSeconds: 25, // Automatically advances to next divine background every 25 seconds
    minDwellSeconds: 20       // Minimum dwell time before score-based or timed advance
  };

  /**
   * Environment Manager (Steps 8-10)
   * Controls progression across the 10 sacred surroundings:
   *  1. Cycles automatically through 10 divine backgrounds every 25 seconds and loops indefinitely
   *  2. Hardware-accelerated dual-layer crossfade (divine-bg-layer-a & divine-bg-layer-b)
   *  3. Shows centered 1.8s banner toast: "✨ NEW DIVINE SURROUNDING ✨ [NAME]"
   *  4. Updates HUD realm badge `#hud-env-badge` (icon & name)
   *  5. Commands `ParticleSystem.setMode()` with custom physics/palettes
   *  6. Supports direct testing via `setEnvironmentByIndex(index)` or `setEnvironmentById(id)`
   */
  class EnvironmentManager {
    constructor(viewport, particleSystem) {
      this.viewport = viewport;
      this.particleSystem = particleSystem;
      this.currentIndex = 0;
      this.dwellTimer = 0; // seconds spent in current environment
      this.cycleInterval = ENVIRONMENT_CONFIG.cycleIntervalSeconds || 25;

      this.layerA = document.getElementById('divine-bg-layer-a');
      this.layerB = document.getElementById('divine-bg-layer-b');
      this.activeLayer = 'a'; // currently visible layer
      this.initialized = false;

      this.bannerEl = document.getElementById('hud-env-banner');
      this.bannerTitleEl = document.getElementById('hud-env-banner-title');
      this.bannerTimeout = null;

      this.badgeEl = document.getElementById('hud-env-badge');
      this.iconEl = document.getElementById('hud-env-icon');
      this.nameEl = document.getElementById('hud-env-name');

      this.applyEnvironment(0, false); // initial state (no banner on fresh start)
      this.bindTimelineClicks();
    }

    getCurrentEnvironment() {
      return ENVIRONMENTS[this.currentIndex];
    }

    update(dt, currentScore) {
      this.dwellTimer += dt;

      // 1. Timed automatic background cycling: switch frequently after every 25s
      // and loops continuously back to 0 when all 10 backgrounds finish!
      if (this.dwellTimer >= this.cycleInterval) {
        const nextIdx = (this.currentIndex + 1) % ENVIRONMENTS.length;
        this.applyEnvironment(nextIdx, true);
        return;
      }

      // 2. Score threshold advancement (if score milestone reached ahead of timer)
      const nextIdx = (this.currentIndex + 1) % ENVIRONMENTS.length;
      if (nextIdx !== 0 && this.currentIndex < ENVIRONMENTS.length - 1) {
        const nextEnv = ENVIRONMENTS[nextIdx];
        if (currentScore >= nextEnv.minScore && this.dwellTimer >= ENVIRONMENT_CONFIG.minDwellSeconds) {
          this.applyEnvironment(nextIdx, true);
        }
      }
    }

    applyEnvironment(index, showToast = true) {
      if (index < 0 || index >= ENVIRONMENTS.length) return;
      this.currentIndex = index;
      this.dwellTimer = 0;
      const env = ENVIRONMENTS[index];

      // 1. Smooth Hardware-Accelerated Dual-Layer Crossfade
      if (!this.initialized) {
        this.initialized = true;
        if (this.layerA) {
          this.layerA.style.backgroundImage = `url('${env.bgUrl}')`;
          this.layerA.classList.add('is-active');
        }
        if (this.layerB) {
          this.layerB.classList.remove('is-active');
        }
        this.activeLayer = 'a';
      } else {
        if (this.layerA && this.layerB) {
          if (this.activeLayer === 'a') {
            this.layerB.style.backgroundImage = `url('${env.bgUrl}')`;
            this.layerB.classList.add('is-active');
            this.layerA.classList.remove('is-active');
            this.activeLayer = 'b';
          } else {
            this.layerA.style.backgroundImage = `url('${env.bgUrl}')`;
            this.layerA.classList.add('is-active');
            this.layerB.classList.remove('is-active');
            this.activeLayer = 'a';
          }
        } else if (this.layerA) {
          this.layerA.style.backgroundImage = `url('${env.bgUrl}')`;
          this.layerA.classList.add('is-active');
        }
      }

      // 2. Update viewport CSS classes (for ambient lighting & theme styles)
      if (this.viewport) {
        ENVIRONMENTS.forEach(e => this.viewport.classList.remove(e.className));
        this.viewport.classList.add(env.className);
      }

      // 3. Command Particle System
      if (this.particleSystem && typeof this.particleSystem.setMode === 'function') {
        this.particleSystem.setMode(env.particleMode);
      }

      // 4. Update HUD Realm Badge
      if (this.iconEl) this.iconEl.textContent = env.icon;
      if (this.nameEl) this.nameEl.textContent = env.name;
      if (this.badgeEl) {
        this.badgeEl.setAttribute('aria-label', `Current Surrounding: ${env.name}`);
        this.badgeEl.classList.remove('is-changing');
        void this.badgeEl.offsetWidth;
        this.badgeEl.classList.add('is-changing');
        setTimeout(() => {
          if (this.badgeEl) this.badgeEl.classList.remove('is-changing');
        }, 1200);
      }

      // 5. Trigger centered transition toast banner
      if (showToast) {
        this.showTransitionBanner(env.toastTitle);
      }

      // 6. Update Timeline Cards Highlight if present
      this.updateTimelineCards(index);
    }

    updateTimelineCards(activeIndex) {
      const timelineCards = document.querySelectorAll('.timeline-realm-card');
      if (!timelineCards || timelineCards.length === 0) return;
      timelineCards.forEach((card, idx) => {
        if (idx === activeIndex || (activeIndex >= 4 && idx === 4)) {
          card.classList.add('is-active');
        } else {
          card.classList.remove('is-active');
        }
      });
    }

    bindTimelineClicks() {
      const timelineCards = document.querySelectorAll('.timeline-realm-card');
      if (!timelineCards || timelineCards.length === 0) return;
      timelineCards.forEach((card, idx) => {
        const targetIdx = card.hasAttribute('data-env-index') ? parseInt(card.getAttribute('data-env-index'), 10) : idx;
        card.addEventListener('click', () => {
          this.applyEnvironment(targetIdx, true);
        });
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.applyEnvironment(targetIdx, true);
          }
        });
      });
    }

    showTransitionBanner(title) {
      if (!this.bannerEl) return;
      if (this.bannerTitleEl) {
        this.bannerTitleEl.textContent = title;
      }
      if (this.bannerTimeout) clearTimeout(this.bannerTimeout);
      this.bannerEl.classList.remove('is-hidden');
      this.bannerTimeout = setTimeout(() => {
        if (this.bannerEl) this.bannerEl.classList.add('is-hidden');
      }, 1800);
    }

    setEnvironmentById(id) {
      const idx = ENVIRONMENTS.findIndex(e => e.id === id);
      if (idx !== -1) {
        this.applyEnvironment(idx, true);
      }
    }

    setEnvironmentByIndex(idx) {
      this.applyEnvironment(idx, true);
    }

    reset() {
      if (this.bannerTimeout) clearTimeout(this.bannerTimeout);
      if (this.bannerEl) this.bannerEl.classList.add('is-hidden');
      this.applyEnvironment(0, false);
    }
  }

  /**
   * Combo & Streak Manager (Step 6)
   * Tracks consecutive modak collections, awards streak bonuses (+5 every 3 modaks),
   * updates HUD badge state, and tracks maximum streak for the round.
   */
  class ComboManager {
    constructor() {
      this.combo = 0;
      this.maxCombo = 0;
      this.badgeEl = document.getElementById('hud-combo-badge');
      this.valueEl = document.getElementById('hud-combo-value');
      this.render(false);
    }

    registerCollection() {
      this.combo += 1;
      if (this.combo > this.maxCombo) {
        this.maxCombo = this.combo;
      }

      let bonus = 0;
      if (COMBO_CONFIG.enabled && this.combo % COMBO_CONFIG.bonusEvery === 0) {
        bonus = COMBO_CONFIG.bonusAmount;
      }

      this.render(true);
      return bonus;
    }

    registerMiss() {
      if (this.combo > 0) {
        this.combo = 0;
        this.render(false);
      }
    }

    reset() {
      this.combo = 0;
      this.maxCombo = 0;
      this.render(false);
    }

    render(triggerPop = false) {
      if (this.valueEl) {
        this.valueEl.textContent = this.combo > 0 ? `×${this.combo}` : '—';
      }
      if (this.badgeEl) {
        this.badgeEl.setAttribute('aria-label', `Current Streak: ${this.combo}`);
        if (this.combo > 0) {
          this.badgeEl.classList.remove('is-inactive');
          this.badgeEl.classList.add('is-active');
        } else {
          this.badgeEl.classList.remove('is-active');
          this.badgeEl.classList.add('is-inactive');
        }

        if (triggerPop) {
          this.badgeEl.classList.remove('is-popping');
          void this.badgeEl.offsetWidth;
          this.badgeEl.classList.add('is-popping');
          if (this.valueEl) {
            this.valueEl.classList.remove('num-pop');
            void this.valueEl.offsetWidth;
            this.valueEl.classList.add('num-pop');
          }
        }
      }
    }
  }

  /**
   * Special Modak & Power-Up Configuration (Step 7)
   */
  const SPECIAL_MODAK_CONFIG = {
    swiftDuration: 5000,           // 5 seconds
    swiftMovementMultiplier: 1.35, // 35% speed boost
    swiftScore: 15,
    magnetDuration: 6000,          // 6 seconds
    magnetRadius: 180,             // Attraction radius in pixels
    magnetStrength: 180,           // Gentle attraction pull in px/s
    magnetScore: 15
  };

  /**
   * Special Effect Manager (Step 7)
   * Tracks active Swift and Magnet power-up durations,
   * updates HUD indicators with live countdowns,
   * coordinates sacred player auras, and handles clean resets.
   */
  class SpecialEffectManager {
    constructor(player) {
      this.player = player;
      this.swiftRemaining = 0;
      this.magnetRemaining = 0;
      this.swiftPill = document.getElementById('hud-effect-swift');
      this.magnetPill = document.getElementById('hud-effect-magnet');
      this.swiftTimeEl = document.getElementById('hud-swift-timer');
      this.magnetTimeEl = document.getElementById('hud-magnet-timer');
      this.render();
    }

    activateSwift() {
      this.swiftRemaining = SPECIAL_MODAK_CONFIG.swiftDuration / 1000;
      if (this.player) {
        this.player.setSwiftEffect(true);
      }
      this.render();
    }

    activateMagnet() {
      this.magnetRemaining = SPECIAL_MODAK_CONFIG.magnetDuration / 1000;
      if (this.player) {
        this.player.setMagnetEffect(true);
      }
      this.render();
    }

    update(dt) {
      let changed = false;

      if (this.swiftRemaining > 0) {
        this.swiftRemaining = Math.max(0, this.swiftRemaining - dt);
        if (this.swiftRemaining === 0 && this.player) {
          this.player.setSwiftEffect(false);
        }
        changed = true;
      }

      if (this.magnetRemaining > 0) {
        this.magnetRemaining = Math.max(0, this.magnetRemaining - dt);
        if (this.magnetRemaining === 0 && this.player) {
          this.player.setMagnetEffect(false);
        }
        changed = true;
      }

      if (changed) {
        this.render();
      }
    }

    isSwiftActive() {
      return this.swiftRemaining > 0;
    }

    isMagnetActive() {
      return this.magnetRemaining > 0;
    }

    reset() {
      this.swiftRemaining = 0;
      this.magnetRemaining = 0;
      if (this.player) {
        this.player.setSwiftEffect(false);
        this.player.setMagnetEffect(false);
      }
      this.render();
    }

    render() {
      // Swift indicator pill
      if (this.swiftPill) {
        if (this.swiftRemaining > 0) {
          this.swiftPill.classList.remove('is-hidden');
          if (this.swiftTimeEl) {
            this.swiftTimeEl.textContent = `${Math.ceil(this.swiftRemaining)}s`;
          }
        } else {
          this.swiftPill.classList.add('is-hidden');
        }
      }

      // Magnet indicator pill
      if (this.magnetPill) {
        if (this.magnetRemaining > 0) {
          this.magnetPill.classList.remove('is-hidden');
          if (this.magnetTimeEl) {
            this.magnetTimeEl.textContent = `${Math.ceil(this.magnetRemaining)}s`;
          }
        } else {
          this.magnetPill.classList.add('is-hidden');
        }
      }
    }
  }

  /**
   * Power Configuration (Step 3)
   * 5 Devotional Power stages with visual aura transformations.
   */
  const POWER_CONFIG = {
    ladoo: 1,
    normalModak: 2,
    goldenModak: 4,
    blessedModak: 7,
    swiftModak: 3,
    magnetModak: 3,
    flower: 10,
    stages: [
      { stage: 1, name: 'Peaceful', min: 0, max: 9 },
      { stage: 2, name: 'Blessed', min: 10, max: 24 },
      { stage: 3, name: 'Radiant', min: 25, max: 49 },
      { stage: 4, name: 'Luminous', min: 50, max: 79 },
      { stage: 5, name: 'Divine', min: 80, max: Infinity }
    ]
  };

  /**
   * Power Manager (Step 3)
   * Tracks accumulated devotional power, controls the 5 visual aura stages on Ganesh Ji,
   * updates the HUD power badge & progress bar, and triggers celebration banners on stage advancement.
   */
  class PowerManager {
    constructor(player) {
      this.player = player;
      this.power = 0;
      this.currentStage = 1;
      this.countEl = document.getElementById('hud-power-count');
      this.tierEl = document.getElementById('hud-power-tier');
      this.fillEl = document.getElementById('hud-power-fill');
      this.badgeEl = document.getElementById('hud-power-badge');
      this.bannerEl = document.getElementById('hud-power-banner');
      this.bannerTextEl = document.getElementById('hud-power-banner-text');
      this.bannerTimeout = null;
      this.render();
    }

    addPower(amount) {
      if (amount <= 0) return;
      this.power += amount;
      const newStageObj = this.getStageForPower(this.power);
      if (newStageObj.stage > this.currentStage) {
        this.currentStage = newStageObj.stage;
        if (this.player) {
          this.player.setPowerStage(this.currentStage);
        }
        this.showAwakenedBanner(newStageObj.name);
      }
      this.render(true);
    }

    getStageForPower(val) {
      for (let i = POWER_CONFIG.stages.length - 1; i >= 0; i--) {
        if (val >= POWER_CONFIG.stages[i].min) {
          return POWER_CONFIG.stages[i];
        }
      }
      return POWER_CONFIG.stages[0];
    }

    getStageName() {
      return this.getStageForPower(this.power).name;
    }

    showAwakenedBanner(stageName) {
      if (!this.bannerEl) return;
      if (this.bannerTextEl) {
        this.bannerTextEl.textContent = `POWER AWAKENED: ${stageName.toUpperCase()}`;
      }
      if (this.bannerTimeout) clearTimeout(this.bannerTimeout);
      this.bannerEl.classList.remove('is-hidden');
      this.bannerTimeout = setTimeout(() => {
        if (this.bannerEl) this.bannerEl.classList.add('is-hidden');
      }, 1200);
    }

    render(animate = false) {
      const stageObj = this.getStageForPower(this.power);
      if (this.countEl) {
        this.countEl.textContent = String(this.power);
        if (animate) {
          this.countEl.classList.remove('num-pop');
          void this.countEl.offsetWidth;
          this.countEl.classList.add('num-pop');
        }
      }
      if (this.tierEl) {
        this.tierEl.textContent = stageObj.name;
      }
      if (this.badgeEl) {
        this.badgeEl.setAttribute(
          'aria-label',
          `Devotional Power: ${this.power}, Stage ${this.currentStage} ${stageObj.name}`
        );
      }

      // Progress bar fill to next stage
      if (this.fillEl) {
        let percent = 100;
        if (stageObj.stage < 5) {
          const nextStageObj = POWER_CONFIG.stages[stageObj.stage];
          const range = nextStageObj.min - stageObj.min;
          const currentInRange = this.power - stageObj.min;
          percent = Math.min(100, Math.max(0, (currentInRange / range) * 100));
        }
        this.fillEl.style.width = `${percent.toFixed(0)}%`;
      }
    }

    reset() {
      this.power = 0;
      this.currentStage = 1;
      if (this.bannerTimeout) clearTimeout(this.bannerTimeout);
      if (this.bannerEl) this.bannerEl.classList.add('is-hidden');
      if (this.player) {
        this.player.setPowerStage(1);
      }
      if (this.countEl) {
        this.countEl.classList.remove('num-pop');
      }
      this.render(false);
    }
  }

  /**
   * Difficulty Configuration & Tier Definitions (Step 11)
   * 5 Progressive Tiers matching Levels 1-5 and devotional environments:
   * 1: Shubh Prarambh (Easy)
   * 2: Prasanna (Normal)
   * 3: Tejaswi (Fast)
   * 4: Ananda (Advanced)
   * 5: Moksha Siddhi (Divine)
   */
  const DIFFICULTY_TIERS = [
    {
      tier: 1,
      name: 'Shubh Prarambh',
      label: 'Easy',
      modak: { spawnInterval: 1200, fallSpeed: 180, maxActive: 5 },
      ladoo: { spawnInterval: 1400, fallSpeed: 100, maxActive: 4 },
      matka: { spawnInterval: 5500, fallSpeed: 110, maxActive: 1 }
    },
    {
      tier: 2,
      name: 'Prasanna',
      label: 'Normal',
      modak: { spawnInterval: 1000, fallSpeed: 220, maxActive: 5 },
      ladoo: { spawnInterval: 1200, fallSpeed: 120, maxActive: 4 },
      matka: { spawnInterval: 4600, fallSpeed: 130, maxActive: 2 }
    },
    {
      tier: 3,
      name: 'Tejaswi',
      label: 'Fast',
      modak: { spawnInterval: 850, fallSpeed: 260, maxActive: 6 },
      ladoo: { spawnInterval: 1050, fallSpeed: 140, maxActive: 5 },
      matka: { spawnInterval: 3800, fallSpeed: 150, maxActive: 2 }
    },
    {
      tier: 4,
      name: 'Ananda',
      label: 'Advanced',
      modak: { spawnInterval: 720, fallSpeed: 300, maxActive: 6 },
      ladoo: { spawnInterval: 900, fallSpeed: 165, maxActive: 5 },
      matka: { spawnInterval: 3200, fallSpeed: 175, maxActive: 3 }
    },
    {
      tier: 5,
      name: 'Moksha Siddhi',
      label: 'Divine',
      modak: { spawnInterval: 600, fallSpeed: 340, maxActive: 7 },
      ladoo: { spawnInterval: 800, fallSpeed: 185, maxActive: 6 },
      matka: { spawnInterval: 2800, fallSpeed: 200, maxActive: 3 }
    }
  ];

  const DIFFICULTY_CONFIG = {
    startingSpawnInterval: 1200,
    minimumSpawnInterval: 600,
    startingFallSpeed: 180,
    maximumFallSpeed: 340,
    tiers: DIFFICULTY_TIERS
  };

  /**
   * Difficulty Manager (Step 5, 8 & 11)
   * Gradually scales spawn rate and falling speed across Modaks, Ladoos, and Matkis
   * based on current level (1 to 5) and player score.
   */
  class DifficultyManager {
    constructor() {
      this.currentLevel = 1;
      this.score = 0;
      this.currentTierIndex = 0;
      this.activeTier = DIFFICULTY_TIERS[0];
      this.updateTier();
    }

    update(arg1, arg2, arg3) {
      // Support update(dt, score, currentLevel) and legacy update(score, currentLevel)
      if (typeof arg3 === 'number') {
        // (dt, score, currentLevel)
        this.score = typeof arg2 === 'number' ? arg2 : this.score;
        this.currentLevel = Math.max(1, Math.min(5, arg3));
      } else if (typeof arg2 === 'number') {
        // (score, currentLevel)
        this.score = typeof arg1 === 'number' ? arg1 : this.score;
        this.currentLevel = Math.max(1, Math.min(5, arg2));
      } else if (typeof arg1 === 'number') {
        this.score = arg1;
      }
      this.updateTier();
    }

    updateTier() {
      const idx = Math.max(0, Math.min(DIFFICULTY_TIERS.length - 1, (this.currentLevel || 1) - 1));
      this.currentTierIndex = idx;
      this.activeTier = DIFFICULTY_TIERS[idx];
    }

    getModakSpawnInterval() {
      return this.activeTier.modak.spawnInterval;
    }

    getModakFallSpeed() {
      return this.activeTier.modak.fallSpeed;
    }

    getModakMaxActive() {
      return this.activeTier.modak.maxActive;
    }

    getLadooSpawnInterval() {
      return this.activeTier.ladoo.spawnInterval;
    }

    getLadooFallSpeed() {
      return this.activeTier.ladoo.fallSpeed;
    }

    getLadooMaxActive() {
      return this.activeTier.ladoo.maxActive;
    }

    getMatkaSpawnInterval() {
      return this.activeTier.matka.spawnInterval;
    }

    getMatkaFallSpeed() {
      return this.activeTier.matka.fallSpeed;
    }

    getMatkaMaxActive() {
      return this.activeTier.matka.maxActive;
    }

    getDifficultyTier() {
      return this.activeTier.tier;
    }

    getDifficultyName() {
      return `${this.activeTier.name} (${this.activeTier.label})`;
    }

    // Backward-compatibility aliases
    getSpawnInterval() {
      return this.getModakSpawnInterval();
    }

    getFallSpeed() {
      return this.getModakFallSpeed();
    }

    getMaxActive() {
      return this.getModakMaxActive();
    }

    reset() {
      this.currentLevel = 1;
      this.score = 0;
      this.currentTierIndex = 0;
      this.updateTier();
    }
  }

  /**
   * Modak Spawn Probabilities (Step 7)
   * 70% Normal, 15% Golden, 8% Blessed, 4% Swift, 3% Magnet (Sum = 1.00)
   */
  const MODAK_CONFIG = {
    normalChance: 0.70,
    goldenChance: 0.15,
    blessedChance: 0.08,
    swiftChance: 0.04,
    magnetChance: 0.03
  };

  /**
   * Represents an individual falling Modak object.
   */
  class Modak {
    constructor(id, type, x, y, width, height, speed) {
      this.id = id;
      this.type = type; // 'normal' | 'golden' | 'blessed' | 'swift' | 'magnet'
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.speed = speed;
      this.points = type === 'blessed' ? 50 : (
        type === 'golden' ? 25 : (
          type === 'swift' ? SPECIAL_MODAK_CONFIG.swiftScore : (
            type === 'magnet' ? SPECIAL_MODAK_CONFIG.magnetScore : 10
          )
        )
      );
      this.power = type === 'blessed' ? 7 : (
        type === 'golden' ? 4 : (
          type === 'swift' ? 3 : (
            type === 'magnet' ? 3 : 2
          )
        )
      );
      this.element = this.createElement();
      this.render();
    }

    createElement() {
      const el = document.createElement('div');
      el.className = `modak-item modak-${this.type}`;
      el.dataset.id = String(this.id);
      el.style.width = `${this.width.toFixed(1)}px`;
      el.style.height = `${this.height.toFixed(1)}px`;
      el.innerHTML = `
        <div class="modak-halo"></div>
        <div class="modak-sparkle-dot"></div>
        <div class="modak-shape">
          <div class="modak-apex"></div>
          <div class="modak-pleats-wrap">
            <div class="modak-pleat-cone"></div>
            <div class="modak-pleat p-1"></div>
            <div class="modak-pleat p-2"></div>
            <div class="modak-pleat p-3"></div>
            <div class="modak-pleat p-4"></div>
            <div class="modak-pleat p-5"></div>
            <div class="modak-pleat p-6"></div>
            <div class="modak-pleat p-7"></div>
          </div>
          <div class="modak-body">
            <div class="modak-body-highlight"></div>
            <div class="modak-body-shadow"></div>
          </div>
          <div class="modak-base"></div>
        </div>
      `;
      return el;
    }

    getHitbox() {
      return {
        x: this.x + this.width * 0.1,
        y: this.y + this.height * 0.1,
        width: this.width * 0.8,
        height: this.height * 0.8
      };
    }

    render() {
      if (this.element) {
        this.element.style.transform = `translate3d(${this.x.toFixed(1)}px, ${this.y.toFixed(1)}px, 0)`;
      }
    }

    destroy() {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      this.element = null;
    }
  }

  /**
   * Axis-Aligned Bounding Box (AABB) 2D Collision Detection
   */
  function checkAABBCollision(boxA, boxB) {
    return (
      boxA.x < boxB.x + boxB.width &&
      boxA.x + boxA.width > boxB.x &&
      boxA.y < boxB.y + boxB.height &&
      boxA.y + boxA.height > boxB.y
    );
  }

  /**
   * DOM Effect Pool (Step 13: Performance Optimization & Particle Pooling)
   * Pre-allocates and reuses floating score popups, collection sparkles, and status toasts
   * to eliminate garbage collection pauses, memory allocation thrashing, and DOM layout churn.
   */
  class DomEffectPool {
    constructor(container) {
      this.container = container;
      this.sparkles = [];
      this.popups = [];
      this.statusPopups = [];
      this.clayDust = [];
      this.maxSparkles = 36;
      this.maxPopups = 10;
      this.maxStatus = 8;
      this.maxClayDust = 14;
      this.init();
    }

    init() {
      if (!this.container) return;

      // Pre-allocate collection sparkles
      for (let i = 0; i < this.maxSparkles; i++) {
        const el = document.createElement('div');
        el.className = 'collection-sparkle';
        el.style.display = 'none';
        this.container.appendChild(el);
        this.sparkles.push({ el, active: false, timeout: null });
      }

      // Pre-allocate score popups
      for (let i = 0; i < this.maxPopups; i++) {
        const el = document.createElement('div');
        el.className = 'score-popup';
        el.style.display = 'none';
        this.container.appendChild(el);
        this.popups.push({ el, active: false, timeout: null });
      }

      // Pre-allocate status / missed popups
      for (let i = 0; i < this.maxStatus; i++) {
        const el = document.createElement('div');
        el.className = 'missed-modak-popup';
        el.style.display = 'none';
        this.container.appendChild(el);
        this.statusPopups.push({ el, active: false, timeout: null });
      }

      // Pre-allocate clay dust particles
      for (let i = 0; i < this.maxClayDust; i++) {
        const el = document.createElement('div');
        el.className = 'clay-dust-particle';
        el.style.display = 'none';
        this.container.appendChild(el);
        this.clayDust.push({ el, active: false, timeout: null });
      }
    }

    spawnSparkle(x, y, dx, dy, color) {
      let item = this.sparkles.find(s => !s.active);
      if (!item) {
        item = this.sparkles[0];
        if (item.timeout) clearTimeout(item.timeout);
      }
      item.active = true;
      const el = item.el;
      el.style.display = 'block';
      el.style.left = `${x.toFixed(1)}px`;
      el.style.top = `${y.toFixed(1)}px`;
      el.style.setProperty('--dx', `${dx.toFixed(1)}px`);
      el.style.setProperty('--dy', `${dy.toFixed(1)}px`);
      el.style.backgroundColor = color;
      el.style.boxShadow = `0 0 6px ${color}`;

      el.classList.remove('is-animating');
      void el.offsetWidth;
      el.classList.add('is-animating');

      if (item.timeout) clearTimeout(item.timeout);
      item.timeout = setTimeout(() => {
        el.style.display = 'none';
        el.classList.remove('is-animating');
        item.active = false;
      }, 550);
    }

    spawnScorePopup(x, y, text, typeClass = '') {
      let item = this.popups.find(p => !p.active);
      if (!item) {
        item = this.popups[0];
        if (item.timeout) clearTimeout(item.timeout);
      }
      item.active = true;
      const el = item.el;
      el.className = `score-popup ${typeClass}`;
      el.textContent = text;
      el.style.display = 'block';
      el.style.left = `${x.toFixed(1)}px`;
      el.style.top = `${y.toFixed(1)}px`;

      el.classList.remove('is-animating');
      void el.offsetWidth;
      el.classList.add('is-animating');

      if (item.timeout) clearTimeout(item.timeout);
      item.timeout = setTimeout(() => {
        el.style.display = 'none';
        el.classList.remove('is-animating');
        item.active = false;
      }, 650);
    }

    spawnStatusPopup(x, y, text, color = '#ffd54f') {
      let item = this.statusPopups.find(p => !p.active);
      if (!item) {
        item = this.statusPopups[0];
        if (item.timeout) clearTimeout(item.timeout);
      }
      item.active = true;
      const el = item.el;
      el.className = 'missed-modak-popup';
      el.style.color = color;
      el.textContent = text;
      el.style.display = 'block';
      el.style.left = `${x.toFixed(1)}px`;
      el.style.top = `${y.toFixed(1)}px`;

      el.classList.remove('is-animating');
      void el.offsetWidth;
      el.classList.add('is-animating');

      if (item.timeout) clearTimeout(item.timeout);
      item.timeout = setTimeout(() => {
        el.style.display = 'none';
        el.classList.remove('is-animating');
        item.active = false;
      }, 700);
    }

    spawnClayDust(x, y, dx, dy) {
      let item = this.clayDust.find(p => !p.active);
      if (!item) {
        item = this.clayDust[0];
        if (item.timeout) clearTimeout(item.timeout);
      }
      item.active = true;
      const el = item.el;
      el.style.display = 'block';
      el.style.left = `${x.toFixed(1)}px`;
      el.style.top = `${y.toFixed(1)}px`;
      el.style.setProperty('--dx', `${dx.toFixed(1)}px`);
      el.style.setProperty('--dy', `${dy.toFixed(1)}px`);

      el.classList.remove('is-animating');
      void el.offsetWidth;
      el.classList.add('is-animating');

      if (item.timeout) clearTimeout(item.timeout);
      item.timeout = setTimeout(() => {
        el.style.display = 'none';
        el.classList.remove('is-animating');
        item.active = false;
      }, 500);
    }

    reset() {
      const resetList = (list) => {
        for (const item of list) {
          if (item.timeout) clearTimeout(item.timeout);
          item.active = false;
          if (item.el) {
            item.el.style.display = 'none';
            item.el.classList.remove('is-animating');
          }
        }
      };
      resetList(this.sparkles);
      resetList(this.popups);
      resetList(this.statusPopups);
      resetList(this.clayDust);
    }
  }

  let globalDomEffectPool = null;
  function getDomEffectPool(container) {
    if (!globalDomEffectPool && container) {
      globalDomEffectPool = new DomEffectPool(container);
    }
    return globalDomEffectPool;
  }

  /**
   * Spawns floating score popups and gentle golden celebratory sparkles upon collection via pool.
   */
  function spawnCollectEffect(container, x, y, points, type, comboBonus = 0) {
    const pool = getDomEffectPool(container);
    if (!pool) return;

    // 1. Floating Score Popup (+5, +10, +15, +25, +50 or total with combo bonus)
    if (points > 0 || comboBonus > 0) {
      const text = comboBonus > 0 ? `+${points + comboBonus}` : `+${points}`;
      pool.spawnScorePopup(x, y, text, `score-${points}`);
    }

    // 1b. Extra Golden Streak or Power-Up Label Indicator
    if (comboBonus > 0) {
      pool.spawnStatusPopup(x, y - 20, `+${comboBonus} Streak Bonus!`, '#ffd54f');
    } else if (type === 'flower') {
      pool.spawnStatusPopup(x, y - 18, '🌸 Divine Attraction!', '#ffab40');
    } else if (type === 'swift') {
      pool.spawnStatusPopup(x, y - 18, '⚡ Swift Speed!', '#fff59d');
    } else if (type === 'magnet') {
      pool.spawnStatusPopup(x, y - 18, '✦ Modak Magnet!', '#81d4fa');
    }

    // 2. Outward Sparkle Burst Particles
    const sparkleCount = type === 'blessed' ? 8 : (type === 'golden' ? 6 : (type === 'flower' ? 6 : 4));
    const palette = type === 'blessed'
      ? ['#ff5252', '#ff80ab', '#ffd54f', '#ffffff']
      : (type === 'flower'
        ? ['#ff7043', '#ffb74d', '#ff5722', '#ffffff', '#ffd54f']
        : (type === 'ladoo'
          ? ['#ffb74d', '#ffa726', '#ffd54f', '#ff9800']
          : (type === 'magnet'
            ? ['#81d4fa', '#4fc3f7', '#e0f7fa', '#ffffff']
            : (type === 'swift'
              ? ['#ffd54f', '#ffca28', '#ffffff', '#ff9800']
              : (type === 'golden' ? ['#ffd700', '#ffecb3', '#fff9c4', '#ffa000'] : ['#ffe082', '#ffd54f', '#ffffff'])))));

    for (let i = 0; i < sparkleCount; i++) {
      const angle = (Math.PI * 2 * i) / sparkleCount + (Math.random() - 0.5) * 0.4;
      const dist = 22 + Math.random() * 26;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      pool.spawnSparkle(x, y, dx, dy, palette[i % palette.length]);
    }
  }

  /**
   * Spawns gentle, respectful floating indicator when a modak is missed via pool.
   */
  function spawnMissedEffect(container, x, y) {
    const pool = getDomEffectPool(container);
    if (!pool) return;
    pool.spawnStatusPopup(x, y, 'Modak Missed', '#ffcc80');
  }

  /**
   * Modak Manager (Step 3 & Step 8)
   * Integrates DifficultyManager for dynamic speeds/intervals, LivesManager for missed modaks,
   * ComboManager for streak multipliers/resets, SpecialEffectManager for Swift & Magnet power-ups,
   * LevelManager for level targets, and PowerManager for devotional power accumulation.
   */
  class ModakManager {
    constructor(
      arena,
      container,
      effectsContainer,
      scoreManager,
      livesManager,
      difficultyManager,
      comboManager,
      specialEffectManager,
      levelManager,
      powerManager
    ) {
      this.arena = arena;
      this.container = container;
      this.effectsContainer = effectsContainer;
      this.scoreManager = scoreManager;
      this.livesManager = livesManager;
      this.difficultyManager = difficultyManager;
      this.comboManager = comboManager;
      this.specialEffectManager = specialEffectManager;
      this.levelManager = levelManager;
      this.powerManager = powerManager;
      this.modaks = [];
      this.spawnTimer = 0;
      this.nextId = 1;
    }

    update(dt, playerHitbox, arenaW, arenaH) {
      if (!this.arena) return;
      const w = arenaW || (this.arena ? this.arena.clientWidth : 800);
      const h = arenaH || (this.arena ? this.arena.clientHeight : 600);

      const currentSpawnInterval = this.difficultyManager ? this.difficultyManager.getModakSpawnInterval() : 1200;
      const currentMaxActive = this.difficultyManager ? this.difficultyManager.getModakMaxActive() : 5;

      // Apply gentle magnetic pull to nearby modaks if Magnet Modak power-up is active
      if (this.specialEffectManager && this.specialEffectManager.isMagnetActive() && playerHitbox) {
        const playerCenterX = playerHitbox.x + playerHitbox.width / 2;
        const playerCenterY = playerHitbox.y + playerHitbox.height / 2;
        const magnetRadius = SPECIAL_MODAK_CONFIG.magnetRadius;
        const magnetPullSpeed = SPECIAL_MODAK_CONFIG.magnetStrength;

        for (const modak of this.modaks) {
          const modakCenterX = modak.x + modak.width / 2;
          const modakCenterY = modak.y + modak.height / 2;
          const dx = playerCenterX - modakCenterX;
          const dy = playerCenterY - modakCenterY;
          const dist = Math.hypot(dx, dy);

          if (dist > 2 && dist < magnetRadius) {
            const pullFactor = 1 - dist / magnetRadius;
            modak.x += (dx / dist) * magnetPullSpeed * pullFactor * dt;
            if (dy > 0) {
              modak.y += (dy / dist) * (magnetPullSpeed * 0.5) * pullFactor * dt;
            }
          }
        }
      }

      // Spawn timer
      this.spawnTimer += dt * 1000;
      if (this.spawnTimer >= currentSpawnInterval && this.modaks.length < currentMaxActive) {
        this.spawn(w);
        this.spawnTimer = 0;
      }

      // Update active modaks
      for (let i = this.modaks.length - 1; i >= 0; i--) {
        const modak = this.modaks[i];
        modak.y += modak.speed * dt;
        modak.render();

        // Check collision with Ganesh Ji
        if (playerHitbox && checkAABBCollision(modak.getHitbox(), playerHitbox)) {
          // Activate special power-ups
          if (this.specialEffectManager) {
            if (modak.type === 'swift') {
              this.specialEffectManager.activateSwift();
            } else if (modak.type === 'magnet') {
              this.specialEffectManager.activateMagnet();
            }
          }

          let comboBonus = 0;
          if (this.comboManager) {
            comboBonus = this.comboManager.registerCollection();
          }

          if (this.scoreManager) {
            this.scoreManager.addPoints(modak.points + comboBonus);
            if (this.difficultyManager) {
              this.difficultyManager.update(
                this.scoreManager.modaksCollected,
                this.levelManager ? this.levelManager.getCurrentLevel() : 1
              );
            }
          }

          if (this.powerManager) {
            this.powerManager.addPower(modak.power);
          }

          if (this.levelManager) {
            this.levelManager.registerModakCollected();
          }

          spawnCollectEffect(
            this.effectsContainer,
            modak.x + modak.width / 2,
            modak.y + modak.height / 2,
            modak.points,
            modak.type,
            comboBonus
          );
          modak.destroy();
          this.modaks.splice(i, 1);
          continue;
        }

        // Check floor contact: Missed Modak (Resets combo streak peacefully without life penalty)
        if (modak.y > h - 5) {
          spawnMissedEffect(
            this.effectsContainer,
            modak.x + modak.width / 2,
            h - 24
          );
          if (this.comboManager) {
            this.comboManager.registerMiss();
          }
          modak.destroy();
          this.modaks.splice(i, 1);
        }
      }
    }

    spawn(arenaW) {
      if (!this.container) return;

      const rand = Math.random();
      let type = 'normal';
      const pBlessed = MODAK_CONFIG.blessedChance;
      const pSwift = pBlessed + MODAK_CONFIG.swiftChance;
      const pMagnet = pSwift + MODAK_CONFIG.magnetChance;
      const pGolden = pMagnet + MODAK_CONFIG.goldenChance;

      if (rand < pBlessed) {
        type = 'blessed';
      } else if (rand < pSwift) {
        type = 'swift';
      } else if (rand < pMagnet) {
        type = 'magnet';
      } else if (rand < pGolden) {
        type = 'golden';
      } else {
        type = 'normal';
      }

      const modakW = Math.max(34, Math.min(46, arenaW * 0.044));
      const modakH = modakW * 1.14;

      const minX = 8;
      const maxX = Math.max(minX, arenaW - modakW - 8);

      // Fair gameplay: avoid overlapping with recently spawned modaks near the top
      let x = minX + Math.random() * (maxX - minX);
      for (let attempt = 0; attempt < 5; attempt++) {
        const tooClose = this.modaks.some(m => m.y < 80 && Math.abs(m.x - x) < 55);
        if (!tooClose) break;
        x = minX + Math.random() * (maxX - minX);
      }

      const y = -modakH - 5;

      const baseSpeed = this.difficultyManager ? this.difficultyManager.getModakFallSpeed() : 180;
      const speed = baseSpeed * (0.92 + Math.random() * 0.16);

      const modak = new Modak(this.nextId++, type, x, y, modakW, modakH, speed);
      this.container.appendChild(modak.element);
      this.modaks.push(modak);
    }

    reset() {
      for (const modak of this.modaks) {
        modak.destroy();
      }
      this.modaks = [];
      this.spawnTimer = 0;
      if (this.effectsContainer) {
        this.effectsContainer.innerHTML = '';
      }
    }
  }

  /**
   * ============================================================================
   * STEP 3: LADOOS, DIVINE FLOWER ATTRACTION & MATKA OBSTACLES
   * ============================================================================
   */

  /**
   * Ladoo Configuration (Step 3: Sweet +5 Points, +1 Power)
   */
  const LADOO_CONFIG = {
    spawnInterval: 1400,
    fallSpeed: 95,
    maxActive: 5,
    points: 5,
    power: 1
  };

  /**
   * Represents an individual falling Ladoo object (Spherical sweet with boondi texture).
   */
  class Ladoo {
    constructor(id, x, y, width, height, speed) {
      this.id = id;
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.speed = speed;
      this.points = LADOO_CONFIG.points;
      this.power = LADOO_CONFIG.power;
      this.element = this.createElement();
      this.render();
    }

    createElement() {
      const el = document.createElement('div');
      el.className = 'ladoo-item';
      el.dataset.id = String(this.id);
      el.style.width = `${this.width.toFixed(1)}px`;
      el.style.height = `${this.height.toFixed(1)}px`;
      el.innerHTML = `
        <div class="ladoo-shape">
          <div class="ladoo-texture-layer"></div>
          <div class="ladoo-gloss"></div>
          <div class="ladoo-boondi b-1"></div>
          <div class="ladoo-boondi b-2"></div>
          <div class="ladoo-boondi b-3"></div>
          <div class="ladoo-boondi b-4"></div>
          <div class="ladoo-boondi b-5"></div>
          <div class="ladoo-boondi b-6"></div>
          <div class="ladoo-boondi b-7"></div>
          <div class="ladoo-boondi b-8"></div>
        </div>
      `;
      return el;
    }

    getHitbox() {
      return {
        x: this.x + this.width * 0.1,
        y: this.y + this.height * 0.1,
        width: this.width * 0.8,
        height: this.height * 0.8
      };
    }

    render() {
      if (this.element) {
        this.element.style.transform = `translate3d(${this.x.toFixed(1)}px, ${this.y.toFixed(1)}px, 0)`;
      }
    }

    destroy() {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      this.element = null;
    }
  }

  /**
   * Ladoo Manager (Step 3)
   * Spawns and manages falling Ladoos (+5 pts, +1 power).
   * Ladoos accelerate towards Ganesh Ji during Divine Attraction.
   * Missed ladoos disappear cleanly without deducting lives.
   */
  class LadooManager {
    constructor(arena, container, effectsContainer, scoreManager, powerManager, difficultyManager = null) {
      this.arena = arena;
      this.container = container;
      this.effectsContainer = effectsContainer;
      this.scoreManager = scoreManager;
      this.powerManager = powerManager;
      this.difficultyManager = difficultyManager;
      this.ladoos = [];
      this.spawnTimer = 0;
      this.nextId = 1;
    }

    update(dt, playerHitbox, arenaW, arenaH) {
      if (!this.arena) return;
      const w = arenaW || (this.arena ? this.arena.clientWidth : 800);
      const h = arenaH || (this.arena ? this.arena.clientHeight : 600);

      const currentSpawnInterval = this.difficultyManager ? this.difficultyManager.getLadooSpawnInterval() : LADOO_CONFIG.spawnInterval;
      const currentMaxActive = this.difficultyManager ? this.difficultyManager.getLadooMaxActive() : LADOO_CONFIG.maxActive;

      this.spawnTimer += dt * 1000;
      if (this.spawnTimer >= currentSpawnInterval && this.ladoos.length < currentMaxActive) {
        this.spawn(w);
        this.spawnTimer = 0;
      }

      for (let i = this.ladoos.length - 1; i >= 0; i--) {
        const ladoo = this.ladoos[i];
        ladoo.y += ladoo.speed * dt;
        ladoo.render();

        // Check collection with Ganesh Ji
        if (playerHitbox && checkAABBCollision(ladoo.getHitbox(), playerHitbox)) {
          if (this.scoreManager) {
            this.scoreManager.addLadoo(ladoo.points);
          }
          if (this.powerManager) {
            this.powerManager.addPower(ladoo.power);
          }
          spawnCollectEffect(
            this.effectsContainer,
            ladoo.x + ladoo.width / 2,
            ladoo.y + ladoo.height / 2,
            ladoo.points,
            'ladoo'
          );
          ladoo.destroy();
          this.ladoos.splice(i, 1);
          continue;
        }

        // Floor contact: Missed Ladoo disappears cleanly without penalty
        if (ladoo.y > h - 5) {
          ladoo.destroy();
          this.ladoos.splice(i, 1);
        }
      }
    }

    spawn(arenaW) {
      if (!this.container) return;
      const ladooSize = Math.max(28, Math.min(38, arenaW * 0.038));
      const minX = 10;
      const maxX = Math.max(minX, arenaW - ladooSize - 10);
      let x = minX + Math.random() * (maxX - minX);

      // Avoid overlapping with existing ladoos near top
      for (let attempt = 0; attempt < 4; attempt++) {
        const tooClose = this.ladoos.some(l => l.y < 80 && Math.abs(l.x - x) < 50);
        if (!tooClose) break;
        x = minX + Math.random() * (maxX - minX);
      }

      const y = -ladooSize - 5;
      const baseSpeed = this.difficultyManager ? this.difficultyManager.getLadooFallSpeed() : LADOO_CONFIG.fallSpeed;
      const speed = baseSpeed * (0.92 + Math.random() * 0.16);
      const ladoo = new Ladoo(this.nextId++, x, y, ladooSize, ladooSize, speed);
      this.container.appendChild(ladoo.element);
      this.ladoos.push(ladoo);
    }

    reset() {
      for (const ladoo of this.ladoos) {
        ladoo.destroy();
      }
      this.ladoos = [];
      this.spawnTimer = 0;
    }
  }

  /**
   * Divine Flower Configuration (Step 3 & Gameplay Polish)
   * Timed spawn system: 6s initial delay, 12s interval between opportunities, 7s duration, 260 pull speed.
   */
  const FLOWER_CONFIG = {
    spawnInterval: 12000,      // 12.0s between flower opportunities
    firstSpawnDelay: 6000,     // 6.0s initial wait when game starts
    duration: 7000,            // 7.0 seconds of divine attraction
    attractionStrength: 260,   // Velocity pull in pixels/second
    fallSpeed: 80,             // Gentle, reachable falling speed
    points: 0,                 // Flower provides divine attraction ability, score is 0
    power: 10                  // Awaken +10 Devotional Power
  };

  /**
   * Represents an individual Divine Marigold Flower collectible.
   */
  class DivineFlower {
    constructor(id, x, y, size, speed) {
      this.id = id;
      this.x = x;
      this.y = y;
      this.width = size;
      this.height = size;
      this.speed = speed;
      this.points = FLOWER_CONFIG.points;
      this.power = FLOWER_CONFIG.power;
      this.element = this.createElement();
      this.render();
    }

    createElement() {
      const el = document.createElement('div');
      el.className = 'flower-item';
      el.dataset.id = String(this.id);
      el.style.width = `${this.width.toFixed(1)}px`;
      el.style.height = `${this.height.toFixed(1)}px`;
      el.innerHTML = `
        <div class="flower-halo"></div>
        <div class="flower-bloom">
          <div class="flower-petals-outer"></div>
          <div class="flower-petals-mid"></div>
          <div class="flower-petals-inner"></div>
          <div class="flower-core"></div>
        </div>
        <div class="flower-sparkle-dot ps-1"></div>
        <div class="flower-sparkle-dot ps-2"></div>
        <div class="flower-sparkle-dot ps-3"></div>
      `;
      return el;
    }

    getHitbox() {
      return {
        x: this.x + this.width * 0.15,
        y: this.y + this.height * 0.15,
        width: this.width * 0.7,
        height: this.height * 0.7
      };
    }

    render() {
      if (this.element) {
        this.element.style.transform = `translate3d(${this.x.toFixed(1)}px, ${this.y.toFixed(1)}px, 0)`;
      }
    }

    destroy() {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      this.element = null;
    }
  }

  /**
   * Divine Flower Manager (Step 3 & Gameplay Polish)
   * Controls timed spawning of sacred Marigold flowers at predictable intervals,
   * HUD indicator with smooth progress bar, circular petal aura on Ganesh Ji,
   * and GLOBAL physical attraction drawing ALL active and newly spawned Modaks and Ladoos.
   */
  class FlowerManager {
    constructor(arena, container, effectsContainer, player, scoreManager, powerManager) {
      this.arena = arena;
      this.container = container;
      this.effectsContainer = effectsContainer;
      this.player = player;
      this.scoreManager = scoreManager;
      this.powerManager = powerManager;
      this.flowers = [];
      this.spawnTimer = 0;
      this.hasSpawnedFirst = false;
      this.attractionRemaining = 0;
      this.nextId = 1;
      this.hudPill = document.getElementById('hud-effect-flower');
      this.hudTimer = document.getElementById('hud-flower-timer');
      this.hudProgress = document.getElementById('hud-flower-progress');
      this.renderHUD();
    }

    update(dt, playerHitbox, arenaW, arenaH) {
      if (!this.arena) return;
      const w = arenaW || (this.arena ? this.arena.clientWidth : 800);
      const h = arenaH || (this.arena ? this.arena.clientHeight : 600);

      // Predictable timed spawn system: only one active flower at a time, waits for cycle
      if (this.flowers.length === 0 && this.attractionRemaining <= 0) {
        this.spawnTimer += dt * 1000;
        const intervalNeeded = this.hasSpawnedFirst ? FLOWER_CONFIG.spawnInterval : FLOWER_CONFIG.firstSpawnDelay;
        if (this.spawnTimer >= intervalNeeded) {
          this.spawn(w);
          this.spawnTimer = 0;
          this.hasSpawnedFirst = true;
        }
      }

      // Update falling flowers
      for (let i = this.flowers.length - 1; i >= 0; i--) {
        const flower = this.flowers[i];
        flower.y += flower.speed * dt;
        flower.render();

        // Check collection with Ganesh Ji
        if (playerHitbox && checkAABBCollision(flower.getHitbox(), playerHitbox)) {
          // Flower provides devotional power and activates global attraction (no direct score points)
          if (this.powerManager) {
            this.powerManager.addPower(flower.power);
          }
          this.activateAttraction();
          spawnCollectEffect(
            this.effectsContainer,
            flower.x + flower.width / 2,
            flower.y + flower.height / 2,
            0,
            'flower'
          );
          flower.destroy();
          this.flowers.splice(i, 1);
          continue;
        }

        // Floor contact: disappears cleanly
        if (flower.y > h - 5) {
          flower.destroy();
          this.flowers.splice(i, 1);
        }
      }

      // Update active attraction duration
      if (this.attractionRemaining > 0) {
        this.attractionRemaining = Math.max(0, this.attractionRemaining - dt);
        if (this.attractionRemaining === 0) {
          if (this.player) {
            this.player.setFlowerAttraction(false);
          }
        }
        this.renderHUD();
      }
    }

    activateAttraction() {
      this.attractionRemaining = FLOWER_CONFIG.duration / 1000;
      if (this.player) {
        this.player.setFlowerAttraction(true);
      }
      this.renderHUD();
    }

    isAttractionActive() {
      return this.attractionRemaining > 0;
    }

    /**
     * Applies smooth divine attraction physics to ALL active sweets (Modaks and Ladoos).
     * Sweets are gently drawn directly toward Ganesh Ji's core.
     */
    applyAttraction(items, playerHitbox, dt) {
      if (this.attractionRemaining <= 0 || !playerHitbox || !items) return;
      const playerCenterX = playerHitbox.x + playerHitbox.width / 2;
      const playerCenterY = playerHitbox.y + playerHitbox.height / 2;
      const strength = FLOWER_CONFIG.attractionStrength;

      for (const item of items) {
        const itemCenterX = item.x + item.width / 2;
        const itemCenterY = item.y + item.height / 2;
        const dx = playerCenterX - itemCenterX;
        const dy = playerCenterY - itemCenterY;
        const dist = Math.hypot(dx, dy);

        if (dist > 4) {
          // Distance-scaled smooth pull: Far away: gentle (0.85x), Medium: strong (1.05x), Close: very strong (1.35x)
          const factor = dist > 350 ? 0.85 : (dist > 150 ? 1.05 : 1.35);
          const pullSpeed = strength * factor;

          item.x += (dx / dist) * pullSpeed * dt;
          item.y += (dy / dist) * pullSpeed * dt;
        }
      }
    }

    spawn(arenaW) {
      if (!this.container) return;
      const size = Math.max(34, Math.min(44, arenaW * 0.042));
      // Reachable spawn location: bounded comfortably inside arena
      const minX = Math.max(20, arenaW * 0.12);
      const maxX = Math.min(arenaW - size - 20, arenaW * 0.88);
      const x = minX + Math.random() * (maxX - minX);
      const y = -size - 5;
      const speed = FLOWER_CONFIG.fallSpeed * (0.92 + Math.random() * 0.16);

      const flower = new DivineFlower(this.nextId++, x, y, size, speed);
      this.container.appendChild(flower.element);
      this.flowers.push(flower);
    }

    renderHUD() {
      if (this.hudPill) {
        if (this.attractionRemaining > 0) {
          this.hudPill.classList.remove('is-dormant');
          this.hudPill.classList.remove('is-hidden');
          if (this.hudTimer) {
            this.hudTimer.textContent = `${this.attractionRemaining.toFixed(1)}s`;
          }
          if (this.hudProgress) {
            const pct = (this.attractionRemaining / (FLOWER_CONFIG.duration / 1000)) * 100;
            this.hudProgress.style.width = `${pct.toFixed(0)}%`;
          }
        } else {
          this.hudPill.classList.add('is-dormant');
          if (this.hudTimer) {
            this.hudTimer.textContent = 'READY';
          }
          if (this.hudProgress) {
            this.hudProgress.style.width = '0%';
          }
        }
      }
    }

    reset() {
      for (const flower of this.flowers) {
        flower.destroy();
      }
      this.flowers = [];
      this.spawnTimer = 0;
      this.hasSpawnedFirst = false;
      this.attractionRemaining = 0;
      if (this.player) {
        this.player.setFlowerAttraction(false);
      }
      this.renderHUD();
    }
  }

  /**
   * Matka Obstacle Configuration (Step 3: Terracotta Clay Pots)
   */
  const MATKA_CONFIG = {
    spawnInterval: 2500,
    fallSpeed: 105,
    maxActive: 3
  };

  /**
   * Represents an individual falling Matka (Terracotta Clay Pot) environmental obstacle.
   */
  class Matka {
    constructor(id, x, y, width, height, speed) {
      this.id = id;
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.speed = speed;
      this.element = this.createElement();
      this.render();
    }

    createElement() {
      const el = document.createElement('div');
      el.className = 'matka-item';
      el.dataset.id = String(this.id);
      el.style.width = `${this.width.toFixed(1)}px`;
      el.style.height = `${this.height.toFixed(1)}px`;
      el.innerHTML = `
        <div class="matka-shape">
          <div class="matka-rim">
            <div class="matka-rim-highlight"></div>
          </div>
          <div class="matka-neck"></div>
          <div class="matka-belly">
            <div class="matka-shading-left"></div>
            <div class="matka-shading-right"></div>
            <div class="matka-belly-glint"></div>
            <div class="matka-motif-band">
              <span class="motif-diamond"></span>
              <span class="motif-diamond"></span>
              <span class="motif-diamond"></span>
              <span class="motif-diamond"></span>
            </div>
            <div class="matka-bottom-shadow"></div>
          </div>
          <div class="matka-base"></div>
        </div>
      `;
      return el;
    }

    getHitbox() {
      // Fair collision hitbox centered on pot belly
      return {
        x: this.x + this.width * 0.15,
        y: this.y + this.height * 0.15,
        width: this.width * 0.7,
        height: this.height * 0.7
      };
    }

    render() {
      if (this.element) {
        this.element.style.transform = `translate3d(${this.x.toFixed(1)}px, ${this.y.toFixed(1)}px, 0)`;
      }
    }

    destroy() {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      this.element = null;
    }
  }

  /**
   * Matka Manager (Step 3)
   * Spawns falling terracotta clay pots.
   * On collision with Ganesh Ji:
   *  - Deducts 1 life via LivesManager
   *  - Resets combo streak via ComboManager
   *  - Triggers gentle screen rumble on arena
   *  - Spawns clay dust particles and respectful warning popup
   *  - Preserves Ganesh Ji's image without violent destruction
   */
  class MatkaManager {
    constructor(arena, container, effectsContainer, livesManager, comboManager, difficultyManager = null) {
      this.arena = arena;
      this.container = container;
      this.effectsContainer = effectsContainer;
      this.livesManager = livesManager;
      this.comboManager = comboManager;
      this.difficultyManager = difficultyManager;
      this.matkas = [];
      this.spawnTimer = 0;
      this.nextId = 1;
    }

    update(dt, playerHitbox, arenaW, arenaH) {
      if (!this.arena) return;
      const w = arenaW || (this.arena ? this.arena.clientWidth : 800);
      const h = arenaH || (this.arena ? this.arena.clientHeight : 600);

      const currentSpawnInterval = this.difficultyManager ? this.difficultyManager.getMatkaSpawnInterval() : MATKA_CONFIG.spawnInterval;
      const currentMaxActive = this.difficultyManager ? this.difficultyManager.getMatkaMaxActive() : MATKA_CONFIG.maxActive;

      this.spawnTimer += dt * 1000;
      if (this.spawnTimer >= currentSpawnInterval && this.matkas.length < currentMaxActive) {
        this.spawn(w);
        this.spawnTimer = 0;
      }

      for (let i = this.matkas.length - 1; i >= 0; i--) {
        const matka = this.matkas[i];
        matka.y += matka.speed * dt;
        matka.render();

        // Check collision with Ganesh Ji
        if (playerHitbox && checkAABBCollision(matka.getHitbox(), playerHitbox)) {
          // 1. Deduct life
          if (this.livesManager) {
            this.livesManager.loseLife();
          }

          // 2. Reset combo streak
          if (this.comboManager) {
            this.comboManager.registerMiss();
          }

          // 3. Gentle screen rumble
          if (this.arena) {
            this.arena.classList.remove('arena-shake');
            void this.arena.offsetWidth;
            this.arena.classList.add('arena-shake');
            setTimeout(() => {
              if (this.arena) this.arena.classList.remove('arena-shake');
            }, 250);
          }

          // 4. Terracotta clay dust puff
          spawnClayDustEffect(
            this.effectsContainer,
            matka.x + matka.width / 2,
            matka.y + matka.height / 2
          );

          // 5. Respectful warning popup
          spawnMatkaWarning(
            this.effectsContainer,
            matka.x + matka.width / 2,
            matka.y + matka.height / 2
          );

          matka.destroy();
          this.matkas.splice(i, 1);
          continue;
        }

        // Floor contact: Avoided Matka safely disappears without penalty
        if (matka.y > h - 5) {
          matka.destroy();
          this.matkas.splice(i, 1);
        }
      }
    }

    spawn(arenaW) {
      if (!this.container) return;
      const matkaW = Math.max(32, Math.min(44, arenaW * 0.042));
      const matkaH = matkaW * 1.18;
      const minX = 12;
      const maxX = Math.max(minX, arenaW - matkaW - 12);
      let x = minX + Math.random() * (maxX - minX);

      // Avoid overlapping with existing matkas near top
      for (let attempt = 0; attempt < 4; attempt++) {
        const tooClose = this.matkas.some(m => m.y < 80 && Math.abs(m.x - x) < 60);
        if (!tooClose) break;
        x = minX + Math.random() * (maxX - minX);
      }

      const y = -matkaH - 5;
      const baseSpeed = this.difficultyManager ? this.difficultyManager.getMatkaFallSpeed() : MATKA_CONFIG.fallSpeed;
      const speed = baseSpeed * (0.92 + Math.random() * 0.16);
      const matka = new Matka(this.nextId++, x, y, matkaW, matkaH, speed);
      this.container.appendChild(matka.element);
      this.matkas.push(matka);
    }

    reset() {
      for (const matka of this.matkas) {
        matka.destroy();
      }
      this.matkas = [];
      this.spawnTimer = 0;
    }
  }

  function spawnClayDustEffect(container, x, y) {
    const pool = getDomEffectPool(container);
    if (!pool) return;
    const count = 7;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const dist = 18 + Math.random() * 22;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      pool.spawnClayDust(x, y, dx, dy);
    }
  }

  function spawnMatkaWarning(container, x, y) {
    const pool = getDomEffectPool(container);
    if (!pool) return;
    pool.spawnStatusPopup(x, Math.max(20, y - 25), 'Careful! Avoid the Matka', '#ffab91');
  }

  /**
   * Main Game Controller (Step 7 Engine)
   */
  class GaneshGame {
    constructor() {
      this.state = GameState.INIT;
      this.particleSystem = null;
      this.inputManager = null;
      this.player = null;
      this.scoreManager = null;
      this.comboManager = null;
      this.timerManager = null;
      this.livesManager = null;
      this.difficultyManager = null;
      this.specialEffectManager = null;
      this.environmentManager = null;
      this.modakManager = null;
      this.levelManager = null;
      this.powerManager = null;
      this.ladooManager = null;
      this.flowerManager = null;
      this.matkaManager = null;
      this.mushakManager = null;
      this.viewport = null;
      this.arena = null;
      this.modaksContainer = null;
      this.ladoosContainer = null;
      this.flowersContainer = null;
      this.matkasContainer = null;
      this.effectsContainer = null;
      this.gameOverModal = null;
      this.modalFinalModaks = null;
      this.modalFinalLadoos = null;
      this.modalFinalPower = null;
      this.modalFinalScore = null;
      this.modalFinalCombo = null;
      this.btnPlayAgain = null;
      this.pauseBtn = null;

      // Level transition modal elements (Step 8)
      this.levelCompleteModal = null;
      this.levelCompleteTitle = null;
      this.levelCompleteModaks = null;
      this.levelCompleteNext = null;
      this.levelCompleteTargetText = null;
      this.btnLevelContinue = null;

      this.lastTime = 0;
      this.gameLoopId = null;
      this.resizeTimeout = null;
      this.lastArenaWidth = 0;
      this.cachedArenaWidth = 0;
      this.cachedArenaHeight = 0;
      this.domEffectPool = null;

      this.gameLoop = this.gameLoop.bind(this);
      this.handleResize = this.handleResize.bind(this);
      this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
      this.handlePauseToggle = this.handlePauseToggle.bind(this);
      this.handleGameOver = this.handleGameOver.bind(this);
      this.handleLevelComplete = this.handleLevelComplete.bind(this);
      this.continueToNextLevel = this.continueToNextLevel.bind(this);
      this.handleFinalComplete = this.handleFinalComplete.bind(this);
      this.restartGame = this.restartGame.bind(this);
    }

    init() {
      this.viewport = document.getElementById('game-viewport');
      this.arena = document.getElementById('game-arena');
      const canvas = document.getElementById('particle-canvas');
      const playerEl = document.getElementById('ganesh-player');
      this.modaksContainer = document.getElementById('modaks-container');
      this.ladoosContainer = document.getElementById('ladoos-container');
      this.flowersContainer = document.getElementById('flowers-container');
      this.matkasContainer = document.getElementById('matkas-container');
      this.effectsContainer = document.getElementById('effects-container');

      // Modal elements
      this.gameOverModal = document.getElementById('game-over-modal');
      this.modalFinalModaks = document.getElementById('modal-final-modaks');
      this.modalFinalLadoos = document.getElementById('modal-final-ladoos');
      this.modalFinalPower = document.getElementById('modal-final-power');
      this.modalFinalScore = document.getElementById('modal-final-score');
      this.modalFinalCombo = document.getElementById('modal-final-combo');
      this.btnPlayAgain = document.getElementById('btn-play-again');

      // Level Complete transition modal elements (Step 8)
      this.levelCompleteModal = document.getElementById('level-complete-modal');
      this.levelCompleteTitle = document.getElementById('level-complete-title');
      this.levelCompleteModaks = document.getElementById('level-complete-modaks');
      this.levelCompleteNext = document.getElementById('level-complete-next');
      this.levelCompleteTargetText = document.getElementById('level-complete-target-text');
      this.btnLevelContinue = document.getElementById('btn-level-continue');

      if (!this.viewport || !this.arena || !canvas || !playerEl || !this.modaksContainer) {
        console.error('GaneshGame: Required DOM elements missing.');
        return;
      }

      this.cachedArenaWidth = this.arena.clientWidth;
      this.cachedArenaHeight = this.arena.clientHeight;
      this.lastArenaWidth = this.cachedArenaWidth;
      this.domEffectPool = getDomEffectPool(this.effectsContainer);

      // Initialize Particle Engine
      this.particleSystem = new ParticleSystem(canvas);
      this.particleSystem.start();

      // Initialize Input Manager & Player
      this.inputManager = new InputManager();
      this.player = new GaneshPlayer(playerEl, this.arena);

      // Initialize Devotional Power Manager (Step 3: 5 Tiers)
      this.powerManager = new PowerManager(this.player);

      // Initialize Gameplay Managers (Step 3 to Step 8)
      this.difficultyManager = new DifficultyManager();
      this.scoreManager = new ScoreManager();
      this.comboManager = new ComboManager();
      this.specialEffectManager = new SpecialEffectManager(this.player);
      this.livesManager = new LivesManager(3, () => this.handleGameOver('lives_out'));
      this.timerManager = new TimerManager(GAME_CONFIG.roundDuration, () => this.handleGameOver('time_up'));
      this.timerManager.start();

      // Dedicated Level Manager (Step 8)
      this.levelManager = new LevelManager(
        (level, modaks, nextLevel) => this.handleLevelComplete(level, modaks, nextLevel),
        () => this.handleFinalComplete()
      );

      this.modakManager = new ModakManager(
        this.arena,
        this.modaksContainer,
        this.effectsContainer,
        this.scoreManager,
        this.livesManager,
        this.difficultyManager,
        this.comboManager,
        this.specialEffectManager,
        this.levelManager,
        this.powerManager
      );

      // Step 3 & 11: Ladoos (+5 Pts, +1 Power, dynamic difficulty scaling)
      this.ladooManager = new LadooManager(
        this.arena,
        this.ladoosContainer,
        this.effectsContainer,
        this.scoreManager,
        this.powerManager,
        this.difficultyManager
      );

      // Step 3: Divine Flower (+15 Pts, +10 Power, 7s Attraction)
      this.flowerManager = new FlowerManager(
        this.arena,
        this.flowersContainer,
        this.effectsContainer,
        this.player,
        this.scoreManager,
        this.powerManager
      );

      // Step 3 & 11: Matka Obstacles (Terracotta Pots, -1 Life, dynamic difficulty scaling)
      this.matkaManager = new MatkaManager(
        this.arena,
        this.matkasContainer,
        this.effectsContainer,
        this.livesManager,
        this.comboManager,
        this.difficultyManager
      );

      // Mushak Ji - Lord Ganesha's Sacred Helper Mouse Companion
      const mushakEl = document.getElementById('mushak-companion');
      if (mushakEl) {
        this.mushakManager = new MushakManager(
          mushakEl,
          this.player,
          this.scoreManager,
          this.modakManager,
          this.ladooManager
        );
      }

      // Dedicated Sacred Environment Manager (Steps 8-10)
      this.environmentManager = new EnvironmentManager(this.viewport, this.particleSystem);

      // HUD Pause button
      this.pauseBtn = document.getElementById('hud-pause-btn');
      if (this.pauseBtn) {
        this.pauseBtn.addEventListener('click', this.handlePauseToggle);
      }

      // Play Again button
      if (this.btnPlayAgain) {
        this.btnPlayAgain.addEventListener('click', this.restartGame);
      }

      // Level Continue button
      if (this.btnLevelContinue) {
        this.btnLevelContinue.addEventListener('click', this.continueToNextLevel);
      }

      // Listeners
      window.addEventListener('resize', this.handleResize, { passive: true });
      document.addEventListener('visibilitychange', this.handleVisibilityChange);

      // Keyboard shortcut for Level Continue (Enter or Space)
      window.addEventListener('keydown', (e) => {
        if ((e.code === 'Enter' || e.code === 'Space') && this.state === GameState.LEVEL_TRANSITION) {
          e.preventDefault();
          this.continueToNextLevel();
        }
      });

      // Advance state & Start Main Loop
      this.state = GameState.RUNNING;
      this.lastTime = performance.now();
      this.gameLoopId = requestAnimationFrame(this.gameLoop);

      console.log(
        '%c॥ श्री गणेशाय नमः ॥\n%cGanesh Ji – Modak Collector\n%cStep 11 Active: Dynamic Difficulty Scaling, 5 Progressive Tiers, 3 Devotional Lives & Respectful Obstacle Mechanics.',
        'color: #ffd700; font-size: 16px; font-weight: bold; text-shadow: 0 0 6px #d35400;',
        'color: #ff9800; font-size: 13px; font-weight: bold;',
        'color: #f5ebd4; font-size: 11px;'
      );
    }

    handleLevelComplete(level, modaksCollected, nextLevel) {
      if (this.state === GameState.GAME_OVER || this.state === GameState.LEVEL_TRANSITION) return;
      this.state = GameState.LEVEL_TRANSITION;

      // Pause round timer during level transition
      if (this.timerManager) {
        this.timerManager.pause();
      }

      // Reset any active power-up effects
      if (this.specialEffectManager) {
        this.specialEffectManager.reset();
      }

      // Clean up active falling items so none hit the floor during transition
      if (this.modakManager) {
        this.modakManager.reset();
      }
      if (this.ladooManager) {
        this.ladooManager.reset();
      }
      if (this.flowerManager) {
        this.flowerManager.reset();
      }
      if (this.matkaManager) {
        this.matkaManager.reset();
      }

      // Populate transition modal fields
      if (this.levelCompleteTitle) {
        this.levelCompleteTitle.textContent = `LEVEL ${level} COMPLETE`;
      }
      if (this.levelCompleteModaks) {
        this.levelCompleteModaks.textContent = String(modaksCollected);
      }
      if (this.levelCompleteNext) {
        this.levelCompleteNext.textContent = `Level ${nextLevel}`;
      }
      if (this.levelCompleteTargetText && this.levelManager) {
        const nextTarget = this.levelManager.getTarget(nextLevel);
        this.levelCompleteTargetText.textContent = `(Target: ${nextTarget} Modaks)`;
      }

      // Show level complete modal
      if (this.levelCompleteModal) {
        this.levelCompleteModal.classList.remove('is-hidden');
      }

      // Accessible keyboard focus on Continue button
      if (this.btnLevelContinue) {
        setTimeout(() => this.btnLevelContinue.focus(), 100);
      }

      // Reset inputs
      if (this.inputManager) {
        this.inputManager.reset();
      }
    }

    continueToNextLevel() {
      if (this.state !== GameState.LEVEL_TRANSITION) return;

      // Hide transition modal
      if (this.levelCompleteModal) {
        this.levelCompleteModal.classList.add('is-hidden');
      }

      // Advance level in LevelManager
      if (this.levelManager) {
        this.levelManager.advanceLevel();
      }

      // Synchronize difficulty with new level
      if (this.difficultyManager && this.levelManager) {
        this.difficultyManager.update(
          this.scoreManager ? this.scoreManager.modaksCollected : 0,
          this.levelManager.getCurrentLevel()
        );
      }

      // Reset round timer for the fresh level
      if (this.timerManager) {
        this.timerManager.reset();
        this.timerManager.start();
      }

      if (this.mushakManager) {
        this.mushakManager.reset();
      }

      if (this.player) {
        this.player.recalculateBounds();
      }

      // Resume game
      this.state = GameState.RUNNING;
      this.lastTime = performance.now();
      if (!this.gameLoopId) {
        this.gameLoopId = requestAnimationFrame(this.gameLoop);
      }
    }

    handleFinalComplete() {
      if (this.state === GameState.GAME_OVER) return;
      this.state = GameState.GAME_OVER;

      if (this.timerManager) {
        this.timerManager.pause();
      }

      if (this.specialEffectManager) {
        this.specialEffectManager.reset();
      }

      if (this.modakManager) {
        this.modakManager.reset();
      }
      if (this.ladooManager) {
        this.ladooManager.reset();
      }
      if (this.flowerManager) {
        this.flowerManager.reset();
      }
      if (this.matkaManager) {
        this.matkaManager.reset();
      }

      // Update GameOver modal title and subtitle for Final Victory
      const modalTitle = document.getElementById('game-over-title');
      const modalSubtitle = document.getElementById('game-over-desc');
      if (modalTitle) {
        modalTitle.textContent = '॥ MODAK SEVA COMPLETE ॥';
      }
      if (modalSubtitle) {
        modalSubtitle.textContent = 'All 5 Levels Completed! Ganesh Ji is immensely pleased with your divine seva.';
      }

      // Populate final stats
      if (this.modalFinalModaks && this.scoreManager) {
        this.modalFinalModaks.textContent = String(this.scoreManager.modaksCollected);
      }
      if (this.modalFinalLadoos && this.scoreManager) {
        this.modalFinalLadoos.textContent = String(this.scoreManager.ladoosCollected);
      }
      if (this.modalFinalPower && this.powerManager) {
        this.modalFinalPower.textContent = `${this.powerManager.power} (${this.powerManager.getStageName()})`;
      }
      if (this.modalFinalScore && this.scoreManager) {
        this.modalFinalScore.textContent = String(this.scoreManager.score);
      }
      if (this.modalFinalCombo && this.comboManager) {
        this.modalFinalCombo.textContent = `×${this.comboManager.maxCombo}`;
      }

      if (this.gameOverModal) {
        this.gameOverModal.classList.remove('is-hidden');
      }

      if (this.btnPlayAgain) {
        setTimeout(() => this.btnPlayAgain.focus(), 100);
      }

      if (this.inputManager) {
        this.inputManager.reset();
      }
    }

    handleGameOver(reason = 'lives_out') {
      if (this.state === GameState.GAME_OVER) return;
      this.state = GameState.GAME_OVER;

      if (this.timerManager) {
        this.timerManager.pause();
      }

      if (this.specialEffectManager) {
        this.specialEffectManager.reset();
      }

      if (this.modakManager) {
        this.modakManager.reset();
      }
      if (this.ladooManager) {
        this.ladooManager.reset();
      }
      if (this.flowerManager) {
        this.flowerManager.reset();
      }
      if (this.matkaManager) {
        this.matkaManager.reset();
      }

      // Reset modal title to standard
      const modalTitle = document.getElementById('game-over-title');
      if (modalTitle) {
        modalTitle.textContent = 'Your Modak Seva is Complete';
      }

      // Populate final stats
      if (this.modalFinalModaks && this.scoreManager) {
        this.modalFinalModaks.textContent = String(this.scoreManager.modaksCollected);
      }
      if (this.modalFinalLadoos && this.scoreManager) {
        this.modalFinalLadoos.textContent = String(this.scoreManager.ladoosCollected);
      }
      if (this.modalFinalPower && this.powerManager) {
        this.modalFinalPower.textContent = `${this.powerManager.power} (${this.powerManager.getStageName()})`;
      }
      if (this.modalFinalScore && this.scoreManager) {
        this.modalFinalScore.textContent = String(this.scoreManager.score);
      }
      if (this.modalFinalCombo && this.comboManager) {
        this.modalFinalCombo.textContent = `×${this.comboManager.maxCombo}`;
      }

      // Update modal subtitle based on completion reason
      const modalSubtitle = document.getElementById('game-over-desc');
      if (modalSubtitle) {
        if (reason === 'time_up') {
          modalSubtitle.textContent = 'Round time is complete! Ganesh Ji is pleased with your devotional seva.';
        } else {
          modalSubtitle.textContent = 'Ganesh Ji is pleased with your devotional offering!';
        }
      }

      // Display Game Complete overlay
      if (this.gameOverModal) {
        this.gameOverModal.classList.remove('is-hidden');
      }

      // Accessible keyboard focus on Play Again
      if (this.btnPlayAgain) {
        setTimeout(() => this.btnPlayAgain.focus(), 100);
      }

      // Reset inputs
      if (this.inputManager) {
        this.inputManager.reset();
      }
    }

    restartGame() {
      // Hide modals
      if (this.gameOverModal) {
        this.gameOverModal.classList.add('is-hidden');
      }
      if (this.levelCompleteModal) {
        this.levelCompleteModal.classList.add('is-hidden');
      }

      // Reset level manager (returns to Level 1)
      if (this.levelManager) {
        this.levelManager.reset();
      }

      // Reset gameplay subsystems
      if (this.timerManager) {
        this.timerManager.reset();
        this.timerManager.start();
      }
      if (this.specialEffectManager) this.specialEffectManager.reset();
      if (this.comboManager) this.comboManager.reset();
      if (this.scoreManager) this.scoreManager.reset();
      if (this.powerManager) this.powerManager.reset();
      if (this.livesManager) this.livesManager.reset();
      if (this.difficultyManager) this.difficultyManager.reset();
      if (this.modakManager) this.modakManager.reset();
      if (this.ladooManager) this.ladooManager.reset();
      if (this.flowerManager) this.flowerManager.reset();
      if (this.matkaManager) this.matkaManager.reset();
      if (this.environmentManager) this.environmentManager.reset();
      if (this.mushakManager) this.mushakManager.reset();
      if (this.domEffectPool) this.domEffectPool.reset();
      if (this.player) {
        this.player.recalculateBounds();
        this.player.resetPosition();
      }
      if (this.inputManager) this.inputManager.reset();

      // Resume game
      this.state = GameState.RUNNING;
      this.lastTime = performance.now();
      if (!this.gameLoopId) {
        this.gameLoopId = requestAnimationFrame(this.gameLoop);
      }
    }

    gameLoop(timestamp) {
      // Schedule next frame immediately so loop never terminates
      this.gameLoopId = requestAnimationFrame(this.gameLoop);

      if (this.state === GameState.RUNNING || this.state === GameState.READY) {
        // Delta time clamped to 0.05s (20 FPS floor) to prevent physics tunneling
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
        this.lastTime = timestamp;

        if (this.timerManager) {
          this.timerManager.update(dt);
        }

        if (this.specialEffectManager) {
          this.specialEffectManager.update(dt);
        }

        // Dedicated Difficulty Manager update (Step 11)
        if (this.difficultyManager) {
          const score = this.scoreManager ? this.scoreManager.getScore() : 0;
          const level = this.levelManager ? this.levelManager.getCurrentLevel() : 1;
          this.difficultyManager.update(dt, score, level);
        }

        // Dedicated Environment Manager update (Steps 8-10)
        if (this.environmentManager && this.scoreManager) {
          this.environmentManager.update(dt, this.scoreManager.getScore());
        }

        if (this.state === GameState.GAME_OVER || this.state === GameState.LEVEL_TRANSITION) return;

        if (this.player && this.inputManager) {
          const axisX = this.inputManager.getHorizontalAxis();
          const speedMultiplier = this.specialEffectManager && this.specialEffectManager.isSwiftActive()
            ? SPECIAL_MODAK_CONFIG.swiftMovementMultiplier
            : 1.0;
          this.player.update(dt, axisX, speedMultiplier);
        }

        const hitbox = this.player ? this.player.getHitbox() : null;
        const arenaW = this.cachedArenaWidth || (this.arena ? this.arena.clientWidth : 800);
        const arenaH = this.cachedArenaHeight || (this.arena ? this.arena.clientHeight : 600);

        // Mushak Manager update (Sacred mouse companion follows Ganesh Ji & helps collect sweets)
        if (this.mushakManager) {
          this.mushakManager.update(dt, arenaW, arenaH);
        }

        // Step 3: Divine Flower attraction physics
        if (this.flowerManager) {
          this.flowerManager.update(dt, hitbox, arenaW, arenaH);
          if (this.flowerManager.isAttractionActive() && hitbox) {
            if (this.modakManager) {
              this.flowerManager.applyAttraction(this.modakManager.modaks, hitbox, dt);
            }
            if (this.ladooManager) {
              this.flowerManager.applyAttraction(this.ladooManager.ladoos, hitbox, dt);
            }
          }
        }

        if (this.modakManager && hitbox) {
          this.modakManager.update(dt, hitbox, arenaW, arenaH);
        }

        if (this.ladooManager && hitbox) {
          this.ladooManager.update(dt, hitbox, arenaW, arenaH);
        }

        if (this.matkaManager && hitbox) {
          this.matkaManager.update(dt, hitbox, arenaW, arenaH);
        }
      } else {
        this.lastTime = timestamp;
      }
    }

    handleResize() {
      if (this.resizeTimeout) {
        cancelAnimationFrame(this.resizeTimeout);
      }

      this.resizeTimeout = requestAnimationFrame(() => {
        if (this.arena) {
          this.cachedArenaWidth = this.arena.clientWidth;
          this.cachedArenaHeight = this.arena.clientHeight;
        }
        if (this.particleSystem) {
          this.particleSystem.onResize();
        }
        if (this.player && this.arena) {
          this.player.onResize(this.lastArenaWidth);
          this.lastArenaWidth = this.cachedArenaWidth;
        }
      });
    }

    handleVisibilityChange() {
      if (document.hidden) {
        if (this.timerManager && this.state === GameState.RUNNING) this.timerManager.pause();
        if (this.particleSystem) this.particleSystem.pause();
        if (this.inputManager) this.inputManager.reset();
      } else {
        this.lastTime = performance.now();
        if (this.timerManager && this.state === GameState.RUNNING) this.timerManager.resume();
        if (this.particleSystem) this.particleSystem.start();
      }
    }

    handlePauseToggle() {
      if (this.state === GameState.GAME_OVER || this.state === GameState.LEVEL_TRANSITION) return;

      if (this.state === GameState.READY || this.state === GameState.RUNNING) {
        this.state = GameState.PAUSED;
        if (this.timerManager) this.timerManager.pause();
        if (this.particleSystem) this.particleSystem.pause();
        if (this.inputManager) this.inputManager.reset();
        if (this.pauseBtn) {
          this.pauseBtn.setAttribute('aria-label', 'Resume Game (Placeholder)');
          this.pauseBtn.innerHTML = '<span class="btn-icon">▶</span>';
        }
      } else if (this.state === GameState.PAUSED) {
        this.state = GameState.RUNNING;
        this.lastTime = performance.now();
        if (this.timerManager) this.timerManager.resume();
        if (this.particleSystem) this.particleSystem.start();
        if (this.pauseBtn) {
          this.pauseBtn.setAttribute('aria-label', 'Pause Game (Placeholder)');
          this.pauseBtn.innerHTML = '<span class="btn-icon">⏸</span>';
        }
      }
    }
  }

  // Automatic initialization upon DOM readiness
  function launchGame() {
    const game = new GaneshGame();
    game.init();
    window.__GAME_CLASSES__ = {
      ScoreManager,
      PowerManager,
      LivesManager,
      DifficultyManager,
      MushakManager,
      ModakManager,
      LadooManager,
      FlowerManager,
      MatkaManager,
      LevelManager,
      EnvironmentManager,
      ENVIRONMENTS,
      ENVIRONMENT_CONFIG,
      DIFFICULTY_CONFIG,
      DIFFICULTY_TIERS,
      Modak,
      Ladoo,
      DivineFlower,
      Matka,
      GaneshPlayer,
      ParticleSystem,
      DomEffectPool,
      getDomEffectPool,
      POWER_CONFIG,
      LADOO_CONFIG,
      FLOWER_CONFIG,
      MATKA_CONFIG
    };
    window.__GANESH_GAME__ = game;
    window.__ganeshGame = game;
    window.game = game;
    window.Game = window.__GAME_CLASSES__;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', launchGame);
  } else {
    launchGame();
  }
})();
