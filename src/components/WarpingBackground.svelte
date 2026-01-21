<script lang="ts">
  interface Props {
    intensity: number;
  }
  let { intensity = 0 }: Props = $props();

  // Static background - minimal gradient, no intensity reactivity
</script>

<div class="warping-background-container">
  <div class="gradient-layer"></div>
</div>

<style>
  .warping-background-container {
    position: fixed;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    background: linear-gradient(180deg, #0a0f1a 0%, #050810 100%);
  }

  .gradient-layer {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse at 50% 30%,
      rgba(30, 50, 80, 0.2) 0%,
      transparent 60%
    );
    opacity: 0.6;
  }
</style>
