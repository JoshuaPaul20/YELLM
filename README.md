# YELLM: THE ANTI-WHISPER

<p align="center">
  <img src="YELLM.png" alt="YELLM" width="400">
</p>

**Have you ever yelled at your LLM?**

Now you have to.

YELLM is a high-decibel AI interface that makes you earn your answers. No more polite whispers. If you want a response, you better speak up. Literally.

Built for people who think voice assistants have been too comfortable for too long.

---

## What Is This?

YELLM inverts every "calm, private, whisper-friendly" voice assistant paradigm. Instead of optimizing for library-appropriate volumes, YELLM demands you hit **80dB+** before it processes your input.


**Key Features:**
- Volume-gated AI (80dB+ required, no exceptions)
- Real-time audio processing with visual feedback
- Multi-turn conversations that persist between yells
- Canvas-based fluid orb that judges your volume
- Zero backend, privacy-first (everything stays local)
- BYOK for OpenAI and Anthropic

---

## Quick Start

```bash
# Clone and install
git clone https://github.com/[your-username]/yellm.git
cd yellm
bun install

# Start yelling
bun dev
```

Open `http://localhost:5173`, allow microphone access, enter your API key, and start yelling.

---

## Why Does This Exist?

Have you ever:
- Been told to "speak up" in a meeting?
- Wondered why voice assistants reward whispering?
- Wanted to make your laptop fear you?

If you answered yes to any of these, YELLM is for you.

If you answered no, YELLM is still for you. You just don't know it yet.

---

## How It Works

1. **Watch the Orb** - Shows your decibel level in real-time
2. **Yell Louder** - Hit 80dB+ to activate transcription
3. **Keep Yelling** - Records until 1.5 seconds of silence
4. **Get Response** - Speech transcribed and sent to AI
5. **Yell Again** - For follow-ups (history persists)

**The Orb's Judgment:**
- < 70dB: Gray, small, unimpressed
- 70-80dB: Warming up, turning orange
- 80dB+: RED, PARTICLES, APPROVAL
- Recording: Pulsing red with screen shake
- Processing: Purple pulse (AI thinking)

---

## Tech Stack

- **Bun** - Fast TypeScript runtime
- **Svelte 5** - Reactive UI with Runes
- **GSAP** - GPU-accelerated screen shake
- **Tailwind CSS** - Brutalist aesthetic
- **OpenAI / Anthropic APIs** - They don't know you're yelling

---

## Troubleshooting

**"Microphone isn't working"**
- Use `localhost` or HTTPS
- Check browser permissions
- Try yelling at the browser first

**"Decibel levels seem off"**
- Different mics = different sensitivities
- Get closer or louder (preferably louder)

**"My throat hurts"**
- Working as intended
- Try water or whisper to a different AI

---

## FAQ Nobody Asked For

**Q: Is this a joke?**
A: It's a fully functional AI interface that requires yelling. Make of that what you will.

**Q: Will this work in a library?**
A: Absolutely not. Please don't try.

**Q: Can I use this in an office?**
A: Only if you want to establish dominance.

**Q: Can you add a quiet mode?**
A: No. Use ChatGPT.

**Q: Is this art or software?**
A: Yes.

---

## License

MIT License - Be Loud.

---


