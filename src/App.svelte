<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import OrbitalRing from './components/OrbitalRing.svelte';
  import YellOutput, { type Message } from './components/YellOutput.svelte';
  import WarpingBackground from './components/WarpingBackground.svelte';
  import { audioGate, type AudioGateState } from './lib/audio-gate';
  import {
    queryAI,
    loadAPIKey,
    saveAPIKey,
    getCurrentProvider,
    validateAPIKey,
    type AIProvider,
    type Message as AIMessage
  } from './lib/ai-client';
  import { gsap } from 'gsap';

  const CONVERSATION_KEY = 'yellm_conversation';

  // Audio state (Svelte 5 runes)
  let decibelLevel = $state(0);
  let isActive = $state(false);
  let audioError = $state<string | null>(null);

  // Threshold state
  let thresholds = $state({ quiet: 70, yell: 80 });

  // Derived states
  let intensity = $derived(
    Math.min(1, Math.max(0, (decibelLevel - thresholds.quiet) / (thresholds.yell - thresholds.quiet)))
  );
  let isYelling = $derived(decibelLevel >= thresholds.yell);
  let previousIsYelling = $state(false);

  // Speech recognition
  let recognition: SpeechRecognition | null = null;
  let transcript = $state('');
  let isListening = $state(false);
  let silenceTimeout: number | null = null;
  const SILENCE_DURATION = 1500; // Stop after 1.5 seconds of silence

  // AI response state
  let messages = $state<Message[]>([]);
  let isLoadingResponse = $state(false);
  let showYellOutput = $state(false);

  // API key management
  let provider = $state<AIProvider>(getCurrentProvider());
  let apiKey = $state<string>('');
  let showApiKeyPrompt = $state(false);
  let tempApiKey = $state('');
  let tempProvider = $state<AIProvider>('openai');

  // Initialize audio gate
  onMount(async () => {
    // Load thresholds from audio gate
    thresholds = audioGate.getThresholds();

    // Load API key from storage
    const currentProvider = getCurrentProvider();
    provider = currentProvider;
    const storedKey = loadAPIKey(currentProvider);
    if (storedKey) {
      apiKey = storedKey;
    } else {
      showApiKeyPrompt = true;
    }

    // Load conversation history from localStorage
    const savedConversation = localStorage.getItem(CONVERSATION_KEY);
    if (savedConversation) {
      try {
        messages = JSON.parse(savedConversation);
      } catch (e) {
        console.error('Failed to load conversation history:', e);
      }
    }

    try {
      await audioGate.initialize((state: AudioGateState) => {
        decibelLevel = state.decibelLevel;
        isActive = state.isActive;
        audioError = state.error;
      });
    } catch (error) {
      audioError = 'Failed to initialize microphone';
    }

    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = async (event: SpeechRecognitionEvent) => {
        const transcriptText = event.results[0][0].transcript;
        transcript = transcriptText;
        isListening = false;

        // Add user message to conversation
        messages = [...messages, { role: 'user', content: transcriptText }];
        showYellOutput = true;

        // Query AI with conversation history
        if (apiKey && transcriptText) {
          isLoadingResponse = true;

          // Pass conversation history (excluding the just-added user message)
          const conversationHistory = messages.slice(0, -1);
          const response = await queryAI(
            {
              provider,
              apiKey,
              conversationHistory
            },
            transcriptText
          );

          // Add AI response to conversation
          if (response.error) {
            messages = [...messages, { role: 'assistant', content: `ERROR: ${response.error}` }];
          } else {
            messages = [...messages, { role: 'assistant', content: response.text }];
          }

          isLoadingResponse = false;
        }
      };

      recognition.onerror = () => {
        isListening = false;
      };

      recognition.onend = () => {
        isListening = false;
      };
    }
  });

  // Effect: Persist conversation to localStorage
  $effect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CONVERSATION_KEY, JSON.stringify(messages));
    }
  });

  // Effect: Start transcription when crossing yell threshold
  $effect(() => {
    if (isYelling && !previousIsYelling && recognition && !isListening) {
      // Crossed into yell state
      if (!apiKey) {
        showApiKeyPrompt = true;
      } else {
        transcript = '';
        isListening = true;
        recognition.start();
      }
    }

    // Voice Activity Detection - stop after silence
    if (isListening) {
      if (isYelling) {
        // Still yelling - clear any silence timeout
        if (silenceTimeout) {
          clearTimeout(silenceTimeout);
          silenceTimeout = null;
        }
      } else {
        // Dropped below threshold - start silence countdown
        if (!silenceTimeout) {
          silenceTimeout = setTimeout(() => {
            if (recognition && isListening) {
              recognition.stop();
            }
            silenceTimeout = null;
          }, SILENCE_DURATION) as unknown as number;
        }
      }
    }

    previousIsYelling = isYelling;
  });

  // Effect: Animate YELLM title based on intensity
  $effect(() => {
    gsap.to(".hero-title-char", {
      duration: 0.1,
      // Animate scale based on intensity
      scale: 1 + intensity * 0.2,
      // Subtle rotation
      rotation: (i) => Math.sin(i * 0.5 + intensity * 10) * intensity * 5,
      // Subtle position shift
      x: (i) => Math.cos(i * 0.5 + intensity * 10) * intensity * 8,
      y: (i) => Math.sin(i * 0.5 + intensity * 10) * intensity * 8,
      // Color change
      color: intensity > 0.5 ? "#FB923C" : "#FFFFFF",
      // Add text shadow for glowing effect
      textShadow: `0 0 ${intensity * 10}px rgba(251, 146, 60, ${intensity * 0.8})`,
      ease: "power2.out"
    });

    // Add a more pronounced jitter/shake to each character at higher intensities
    if (intensity > 0.3) {
      gsap.to(".hero-title-char", {
        x: () => `random(-${intensity * 10}, ${intensity * 10})`,
        y: () => `random(-${intensity * 10}, ${intensity * 10})`,
        rotationZ: () => `random(-${intensity * 10}, ${intensity * 10})`,
        duration: 0.1,
        ease: "power1.inOut"
      });
    } else {
       gsap.to(".hero-title-char", {
        x: 0,
        y: 0,
        rotationZ: 0,
        duration: .2,
        ease: "power1.out"
      });
    }
  });

  // Cleanup
  onDestroy(() => {
    audioGate.stop();
    if (recognition) {
      recognition.stop();
    }
    if (silenceTimeout) {
      clearTimeout(silenceTimeout);
    }
  });

  function closeYellOutput() {
    showYellOutput = false;
  }

  function clearConversation() {
    messages = [];
    localStorage.removeItem(CONVERSATION_KEY);
  }

  // API key handlers
  function handleSaveApiKey() {
    if (validateAPIKey(tempProvider, tempApiKey)) {
      saveAPIKey(tempProvider, tempApiKey);
      apiKey = tempApiKey;
      provider = tempProvider;
      showApiKeyPrompt = false;
    } else {
      alert('Invalid API key format');
    }
  }

  function handleShowSettings() {
    tempApiKey = apiKey;
    tempProvider = provider;
    showApiKeyPrompt = true;
  }
</script>

<div class="app-container" class:yelling={isYelling}>
  <!-- Warping Background -->
  <WarpingBackground {intensity} />

  <!-- Main Content -->
  <div class="content-wrapper">
    <!-- Hero Section -->
    <section class="hero-section">
      <h1 class="hero-title">
        {#each "YELLM" as char, i}
          <span class="hero-title-char" style="--i: {i};">{char}</span>
        {/each}
      </h1>
      <p class="hero-subtitle">Ever felt like yelling at your LLM?</p>
      <p class="hero-tagline">Reach 80dB to unlock voice input</p>

      {#if audioError}
        <p class="error-message">{audioError}</p>
      {/if}
    </section>

    <!-- Orbital Ring Section -->
    <section class="orb-section">
      <OrbitalRing {decibelLevel} {isListening} isProcessing={isLoadingResponse} {thresholds} />
    </section>
  </div>

  <!-- Yell Output Overlay -->
  <YellOutput
    {messages}
    isLoading={isLoadingResponse}
    show={showYellOutput}
    onClose={closeYellOutput}
    onClearConversation={clearConversation}
  />

  <!-- Settings button -->
  {#if apiKey && !showApiKeyPrompt}
    <button class="settings-button" onclick={handleShowSettings}>
      <img src="/icon.png" alt="Settings" class="settings-icon" />
    </button>
  {/if}

  <!-- API Key Modal -->
  {#if showApiKeyPrompt}
    <div class="api-key-modal">
      <div class="modal-content">
        <div class="modal-header">
          <img src="/icon.png" alt="YELLM" class="modal-logo" />
          <h2>CONFIGURE API KEY</h2>
        </div>
        <p class="modal-description">Your API key is stored locally only. Zero backend. Zero tracking.</p>

        <div class="provider-selector">
          <label class="provider-option" class:selected={tempProvider === 'openai'}>
            <input type="radio" bind:group={tempProvider} value="openai" />
            <span>OpenAI</span>
          </label>
          <label class="provider-option" class:selected={tempProvider === 'anthropic'}>
            <input type="radio" bind:group={tempProvider} value="anthropic" />
            <span>Anthropic</span>
          </label>
        </div>

        <input
          type="password"
          bind:value={tempApiKey}
          placeholder={
            tempProvider === 'openai' ? 'Enter your OpenAI API Key' :
            'Enter your Anthropic API Key'
          }
          class="api-key-input"
        />

        <div class="modal-actions">
          <button onclick={handleSaveApiKey} class="primary-button">SAVE & START</button>
          {#if apiKey}
            <button onclick={() => showApiKeyPrompt = false} class="secondary-button">CANCEL</button>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .app-container {
    position: relative;
    width: 100vw;
    min-height: 100vh;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .content-wrapper {
    position: relative;
    z-index: 10;
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem 1rem;
  }

  /* Hero Section */
  .hero-section {
    width: 100%;
    text-align: center;
    padding: 3rem 0 2rem 0;
    animation: fadeInDown 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .hero-title {
    font-size: 6rem;
    font-weight: 800;
    color: #FFFFFF;
    margin: 0;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    font-family: 'Stack Sans Notch', sans-serif;
  }

  .hero-subtitle {
    font-size: 1.25rem;
    font-weight: 500;
    color: #FB923C;
    margin: 0.5rem 0 0 0;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .hero-tagline {
    font-size: 1rem;
    font-weight: 500;
    color: #9CA3AF;
    margin: 1rem 0 0 0;
    letter-spacing: 0.05em;
  }

  .error-message {
    color: #EF4444; /* neon-red from tailwind config */
    margin-top: 1rem;
    font-size: 1rem;
    font-weight: 500;
  }

  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Orb Section */
  .orb-section {
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem 0;
    min-height: 400px;
  }


  /* Settings Button */
  .settings-button {
    position: fixed;
    top: 2rem;
    left: 2rem;
    width: 4rem;
    height: 4rem;
    background: rgba(0, 0, 0, 0.6);
    border: 2px solid rgba(251, 146, 60, 0.4);
    padding: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 1s cubic-bezier(0.4, 0, 0.2, 1) 0.5s both;
    border-radius: 8px;
  }

  .settings-button:hover {
    background: rgba(251, 146, 60, 0.1);
    border-color: rgba(251, 146, 60, 0.8);
    transform: translateY(-2px);
  }

  .settings-icon {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  /* API Key Modal */
  .api-key-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.95);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
    animation: fadeIn 0.3s ease;
  }

  .modal-content {
    background: #0a0a0a;
    border: 2px solid rgba(251, 146, 60, 0.3);
    padding: 3rem;
    max-width: 600px;
    width: 90%;
    animation: scaleIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 12px;
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .modal-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .modal-logo {
    width: 3rem;
    height: 3rem;
    object-fit: contain;
  }

  .modal-content h2 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #FFFFFF;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .modal-description {
    color: #9CA3AF;
    margin-bottom: 2rem;
    line-height: 1.6;
    font-size: 0.95rem;
  }

  .provider-selector {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .provider-option {
    flex: 1;
    min-width: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: rgba(251, 146, 60, 0.05);
    border: 1.5px solid rgba(251, 146, 60, 0.2);
    color: #9CA3AF;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    text-transform: uppercase;
    font-size: 0.8rem;
    letter-spacing: 0.05em;
    border-radius: 6px;
  }

  .provider-option:hover {
    background: rgba(251, 146, 60, 0.1);
    border-color: rgba(251, 146, 60, 0.4);
  }

  .provider-option.selected {
    background: rgba(251, 146, 60, 0.15);
    border-color: #FB923C;
    color: #FFFFFF;
  }

  .provider-option input[type="radio"] {
    display: none;
  }

  .api-key-input {
    width: 100%;
    padding: 1rem;
    font-size: 1rem;
    background: rgba(0, 0, 0, 0.5);
    border: 1.5px solid rgba(251, 146, 60, 0.3);
    color: #FFFFFF;
    font-family: 'Courier New', monospace;
    margin-bottom: 1.5rem;
    transition: all 0.2s ease;
    border-radius: 6px;
  }

  .api-key-input:focus {
    outline: none;
    border-color: #FB923C;
    background: rgba(0, 0, 0, 0.7);
  }

  .api-key-input::placeholder {
    color: #6B7280;
  }

  .modal-actions {
    display: flex;
    gap: 1rem;
  }

  .primary-button,
  .secondary-button {
    flex: 1;
    padding: 1rem 2rem;
    font-size: 1rem;
    font-weight: 600;
    text-transform: uppercase;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    letter-spacing: 0.05em;
    border-radius: 8px;
  }

  .primary-button {
    background: #FB923C;
    color: #000000;
  }

  .primary-button:hover {
    background: #F97316;
    transform: translateY(-2px);
  }

  .secondary-button {
    background: rgba(251, 146, 60, 0.1);
    color: #FB923C;
    border: 1.5px solid rgba(251, 146, 60, 0.3);
  }

  .secondary-button:hover {
    background: rgba(251, 146, 60, 0.2);
    border-color: rgba(251, 146, 60, 0.5);
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .hero-title {
      font-size: 3.5rem;
      letter-spacing: 0.15em;
    }

    .hero-subtitle {
      font-size: 1rem;
      letter-spacing: 0.2em;
    }

    .hero-tagline {
      font-size: 0.875rem;
    }

    .settings-button {
      width: 3rem;
      height: 3rem;
      top: 1rem;
      left: 1rem;
    }

    .modal-content {
      padding: 2rem;
    }

    .modal-logo {
      width: 2.5rem;
      height: 2.5rem;
    }

    .modal-content h2 {
      font-size: 1.5rem;
    }

    .provider-selector {
      flex-direction: column;
    }

        .provider-option {

          min-width: 100%;

        }

      }

    

      /* Screen shake for yelling state */

      .app-container.yelling {

        animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;

      }

    

      @keyframes shake {

        10%, 90% {

          transform: translate3d(-1px, 0, 0);

        }

        20%, 80% {

          transform: translate3d(2px, 0, 0);

        }

        30%, 50%, 70% {

          transform: translate3d(-4px, 0, 0);

        }

        40%, 60% {

          transform: translate3d(4px, 0, 0);

        }

      }

    </style>
