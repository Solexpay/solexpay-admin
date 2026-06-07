import { Injectable } from "@angular/core";

interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  origin?: { x?: number; y?: number };
  colors?: string[];
  duration?: number;
}

@Injectable({ providedIn: "root" })
export class ConfettiService {
  private defaultColors = [
    "#005bbf", // Primary
    "#00c853", // Tertiary (green)
    "#ff6b00", // Secondary
    "#ff1744", // Error
    "#ffd600", // Warning
    "#00b0ff", // Info
    "#e1e3e4", // Surface
    "#191c1d", // On surface
  ];

  celebrate(options: ConfettiOptions = {}) {
    const {
      particleCount = 100,
      spread = 70,
      origin = { x: 0.5, y: 0.6 },
      colors = this.defaultColors,
      duration = 3000,
    } = options;

    const particles: HTMLDivElement[] = [];
    const container = document.createElement("div");
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9999;
      overflow: hidden;
    `;
    document.body.appendChild(container);

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 10 + 5;

      particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: ${Math.random() > 0.5 ? "50%" : "2px"};
        left: ${origin.x !== undefined ? origin.x * 100 : 50}%;
        top: ${origin.y !== undefined ? origin.y * 100 : 60}%;
        transform: translate(-50%, -50%);
        opacity: 1;
      `;

      // Random physics
      const angle = (Math.random() * spread - spread / 2) * (Math.PI / 180);
      const velocity = Math.random() * 15 + 10;
      const vx = Math.sin(angle) * velocity;
      const vy = -Math.cos(angle) * velocity;
      const gravity = 0.5;
      const drag = 0.96;
      const rotation = Math.random() * 360;
      const rotationSpeed = (Math.random() - 0.5) * 20;

      let posX = 0;
      let posY = 0;
      let velX = vx;
      let velY = vy;
      let rot = rotation;

      container.appendChild(particle);

      // Animation
      const startTime = performance.now();
      const animate = (now: number) => {
        const elapsed = now - startTime;

        if (elapsed > duration) {
          particle.style.opacity = "0";
          return;
        }

        // Physics
        velY += gravity;
        velX *= drag;
        velY *= drag;

        posX += velX;
        posY += velY;
        rot += rotationSpeed;

        // Update position
        particle.style.transform = `
          translate(calc(-50% + ${posX}px), calc(-50% + ${posY}px))
          rotate(${rot}deg)
        `;

        // Fade out near end
        if (elapsed > duration - 500) {
          particle.style.opacity = String(
            1 - (elapsed - (duration - 500)) / 500,
          );
        }

        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
      particles.push(particle);
    }

    // Cleanup
    setTimeout(() => {
      particles.forEach((p) => p.remove());
      container.remove();
    }, duration + 100);
  }

  // Quick celebration preset
  quick() {
    this.celebrate({
      particleCount: 50,
      spread: 60,
      duration: 2000,
    });
  }

  // Big celebration preset
  big() {
    this.celebrate({
      particleCount: 200,
      spread: 100,
      duration: 4000,
    });
  }

  // Success celebration (green themed)
  success() {
    this.celebrate({
      particleCount: 80,
      spread: 70,
      colors: ["#00c853", "#00e676", "#69f0ae", "#005bbf", "#00b0ff"],
      duration: 3000,
    });
  }

  // Burst from center
  burst() {
    this.celebrate({
      particleCount: 150,
      spread: 360,
      origin: { x: 0.5, y: 0.5 },
      duration: 3500,
    });
  }
}
