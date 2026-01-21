<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { gsap } from 'gsap';

  interface Props {
    decibelLevel: number;
    isListening: boolean;
    isProcessing?: boolean;
    thresholds: { quiet: number; yell: number };
  }

  let { decibelLevel = 0, isListening = false, isProcessing = false, thresholds }: Props = $props();

  let canvasRef: HTMLCanvasElement;
  let animationFrame: number;
  let isComponentMounted = true;

  // Derived values
  let progress = $derived(
    Math.min(1, Math.max(0, (decibelLevel - thresholds.quiet) / (thresholds.yell - thresholds.quiet)))
  );
  let statusText = $derived(getStatusText());
  let statusColor = $derived(getStatusColor());

  function getStatusText(): string {
    if (isProcessing) {
      return '⚡ PROCESSING...';
    }
    if (isListening) {
      return '🔴 RECORDING!';
    }
    if (decibelLevel < thresholds.quiet) {
      return 'TOO QUIET - SPEAK UP';
    }
    if (decibelLevel < thresholds.yell) {
      const percentage = Math.round(progress * 100);
      return `ALMOST THERE - ${percentage}%`;
    }
    return 'READY TO RECORD';
  }

  function getStatusColor(): string {
    if (isProcessing) return '#A78BFA'; // purple for processing
    if (isListening) return '#EF4444'; // red
    if (decibelLevel < thresholds.quiet) return '#6B7280'; // gray
    if (decibelLevel < thresholds.yell) return '#FB923C'; // orange
    return '#EF4444'; // red
  }

  let previousIsListening = false;

  // Effect: Trigger explosion when starting to listen
  $effect(() => {
    if (isListening && !previousIsListening) {
      triggerExplosion();
    }
    previousIsListening = isListening;
  });

  onMount(() => {
    if (canvasRef) {
      // Set canvas resolution to match CSS size for crisp rendering
      const dpr = window.devicePixelRatio || 1;
      const rect = canvasRef.getBoundingClientRect();
      canvasRef.width = rect.width * dpr;
      canvasRef.height = rect.height * dpr;

      drawFluidOrb();
    }
  });

  onDestroy(() => {
    isComponentMounted = false;
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  });

  function drawFluidOrb() {
    if (!canvasRef) return;

    const canvas = canvasRef;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    // Scale radius based on canvas size (accounts for DPI scaling)
    const baseRadius = Math.min(canvas.width, canvas.height) * 0.4;

    function animate() {
      if (!ctx || !isComponentMounted) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const time = Date.now() * 0.001;
      const points = 150;

      // Create gradient based on progress/state
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius);

      if (isProcessing) {
        // Processing: purple gradient with pulse
        const pulseFactor = Math.sin(time * 3) * 0.2 + 0.8;
        gradient.addColorStop(0, `rgba(167, 139, 250, ${0.8 * pulseFactor})`);
        gradient.addColorStop(0.5, `rgba(139, 92, 246, ${0.6 * pulseFactor})`);
        gradient.addColorStop(1, `rgba(167, 139, 250, ${0.2 * pulseFactor})`);
      } else if (isListening) {
        // Recording: red/pink gradient
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
        gradient.addColorStop(0.5, 'rgba(251, 113, 133, 0.6)');
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0.2)');
      } else if (progress > 0.7) {
        // Almost there: orange to red
        gradient.addColorStop(0, 'rgba(251, 146, 60, 0.8)');
        gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.6)');
        gradient.addColorStop(1, 'rgba(251, 146, 60, 0.2)');
      } else if (progress > 0.3) {
        // Getting there: blue to orange
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.6)');
        gradient.addColorStop(0.5, 'rgba(251, 146, 60, 0.6)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.2)');
      } else {
        // Quiet: gray/blue
        gradient.addColorStop(0, 'rgba(107, 114, 128, 0.4)');
        gradient.addColorStop(0.5, 'rgba(75, 85, 99, 0.3)');
        gradient.addColorStop(1, 'rgba(107, 114, 128, 0.1)');
      }

      // Draw flowing organic shape
      ctx.beginPath();

      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;

        // Multiple sine waves for organic flow
        const wave1 = Math.sin(angle * 3 + time * 0.5) * 15;
        const wave2 = Math.sin(angle * 5 - time * 0.7) * 8;
        const wave3 = Math.cos(angle * 7 + time * 0.3) * 5;

        // Intensity affects shape amplitude
        const intensityMultiplier = 1 + progress * 0.5;
        const waveSum = (wave1 + wave2 + wave3) * intensityMultiplier;

        const r = baseRadius + waveSum;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Add glow effect
      ctx.shadowBlur = 30 + progress * 40;
      ctx.shadowColor = statusColor;

      // Draw again for stronger glow
      ctx.fill();

      // Draw particles around the orb
      if (progress > 0.5) {
        drawParticles(ctx, centerX, centerY, baseRadius, time, progress);
      }

      animationFrame = requestAnimationFrame(animate);
    }

    animate();
  }

  function drawParticles(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, time: number, progress: number) {
    const particleCount = Math.floor(5 + progress * 15);

    ctx.shadowBlur = 0;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + time;
      const distance = radius + 20 + Math.sin(time * 2 + i) * 10;
      const x = cx + Math.cos(angle) * distance;
      const y = cy + Math.sin(angle) * distance;
      const size = 2 + Math.random() * 3;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = statusColor;
      ctx.globalAlpha = 0.3 + Math.random() * 0.4;
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  function triggerExplosion() {
    // Screen shake
    gsap.to('.orbital-container', {
      x: '+=10',
      yoyo: true,
      repeat: 5,
      duration: 0.05,
      ease: 'power1.inOut',
      onComplete: () => {
        gsap.set('.orbital-container', { x: 0 });
      }
    });

    // Ring explosion
    const rings = document.querySelectorAll('.explosion-ring');
    rings.forEach((ring, index) => {
      gsap.fromTo(
        ring,
        {
          scale: 1,
          opacity: 1
        },
        {
          scale: 3 + index * 0.5,
          opacity: 0,
          duration: 1 + index * 0.2,
          ease: 'power2.out'
        }
      );
    });
  }
</script>

<div class="orbital-container">
  <div class="orb-wrapper">
    <!-- Canvas for fluid orb -->
    <canvas
      bind:this={canvasRef}
      class="orb-canvas"
    ></canvas>

    <!-- Center dB display -->
    <div class="db-display">
      <div class="db-number" style="color: {statusColor}">
        {Math.round(decibelLevel)}
      </div>
      <div class="db-label">dB</div>
    </div>

    <!-- Explosion rings (hidden until triggered) -->
    <div class="explosion-ring"></div>
    <div class="explosion-ring"></div>
    <div class="explosion-ring"></div>
  </div>

  <!-- Status text below -->
  <div class="status-text" style="color: {statusColor}">
    {statusText}
  </div>
</div>

<style>
  .orbital-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
  }

  .orb-wrapper {
    position: relative;
    width: 300px;
    height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .orb-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    filter: blur(2px);
  }

  .db-display {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }

  .db-number {
    font-size: 3.5rem;
    font-weight: 700;
    line-height: 1;
    transition: color 0.3s ease;
    text-shadow: 0 0 20px currentColor;
  }

  .db-label {
    font-size: 1rem;
    font-weight: 500;
    color: #9CA3AF;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-top: 0.25rem;
  }

  .explosion-ring {
    position: absolute;
    width: 260px;
    height: 260px;
    border-radius: 50%;
    border: 3px solid #EF4444;
    opacity: 0;
    pointer-events: none;
  }

  .status-text {
    font-family: 'Syne Mono', monospace;
    font-size: 0.875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    text-align: center;
    transition: color 0.3s ease;
    min-height: 1.5rem;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .orb-wrapper {
      width: 250px;
      height: 250px;
    }

    .orb-canvas {
      width: 250px;
      height: 250px;
    }

    .db-number {
      font-size: 2.5rem;
    }

    .explosion-ring {
      width: 220px;
      height: 220px;
    }

    .status-text {
      font-size: 0.75rem;
    }
  }
</style>
