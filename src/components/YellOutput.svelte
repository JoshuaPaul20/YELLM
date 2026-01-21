<script lang="ts">
  export interface Message {
    role: 'user' | 'assistant';
    content: string;
  }

  interface Props {
    messages: Message[];
    isLoading: boolean;
    show: boolean;
    onClose: () => void;
    onClearConversation?: () => void;
  }

  let { messages = [], isLoading = false, show = false, onClose, onClearConversation }: Props = $props();
</script>

{#if show}
  <div class="overlay" role="dialog" aria-modal="true">
    <div class="chat-container" role="document" onclick={(e) => e.stopPropagation()}>
      <div class="chat-header">
        <div class="header-content">
          <h2>YELLM CONVERSATION</h2>
          {#if messages.length > 0 && onClearConversation}
            <button class="clear-button" onclick={onClearConversation}>
              Clear History
            </button>
          {/if}
        </div>
        <button class="close-button" onclick={onClose} aria-label="Close conversation">×</button>
      </div>

      <div class="chat-messages">
        {#each messages as message}
          <div class="message {message.role}">
            <div class="message-label">
              {message.role === 'user' ? 'YOU YELLED:' : 'YELLM:'}
            </div>
            <div class="message-content">
              {message.content}
            </div>
          </div>
        {/each}

        {#if isLoading}
          <div class="message assistant loading">
            <div class="message-label">YELLM:</div>
            <div class="message-content">
              <span class="glitch" data-text="PROCESSING...">PROCESSING...</span>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(16px);
    animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    padding: 1rem;
  }

  @keyframes fadeIn {
    from {
      background-color: rgba(0, 0, 0, 0);
      backdrop-filter: blur(0px);
    }
    to {
      background-color: rgba(0, 0, 0, 0.9);
      backdrop-filter: blur(16px);
    }
  }

  .chat-container {
    width: 100%;
    max-width: 900px;
    max-height: 85vh;
    background: linear-gradient(180deg, #0f0f0f 0%, #0a0a0a 100%);
    border: 2px solid rgba(251, 146, 60, 0.4);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(251, 146, 60, 0.1);
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2rem 2rem 1.5rem 2rem;
    border-bottom: 1px solid rgba(251, 146, 60, 0.2);
    background: rgba(251, 146, 60, 0.03);
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .header-content h2 {
    font-family: 'Syne Mono', monospace;
    font-size: 1.5rem;
    font-weight: 700;
    color: #FB923C;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    text-shadow: 0 0 20px rgba(251, 146, 60, 0.3);
  }

  .clear-button {
    font-family: 'Syne Mono', monospace;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6B7280;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 6px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .clear-button:hover {
    color: #EF4444;
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.5);
    transform: translateY(-1px);
  }

  .close-button {
    font-size: 2.5rem;
    color: #6B7280;
    background: rgba(251, 146, 60, 0.05);
    border: 1px solid rgba(251, 146, 60, 0.2);
    border-radius: 8px;
    cursor: pointer;
    line-height: 1;
    padding: 0;
    width: 3rem;
    height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .close-button:hover {
    color: #FB923C;
    background: rgba(251, 146, 60, 0.15);
    border-color: rgba(251, 146, 60, 0.5);
    transform: scale(1.05);
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .message {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.5rem;
    border-radius: 12px;
    animation: messageIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(10px);
  }

  @keyframes messageIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .message.user {
    background: linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(251, 146, 60, 0.08) 100%);
    border: 1.5px solid rgba(251, 146, 60, 0.4);
    align-self: flex-end;
    max-width: 75%;
    box-shadow: 0 4px 12px rgba(251, 146, 60, 0.1);
  }

  .message.assistant {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.08) 100%);
    border: 1.5px solid rgba(239, 68, 68, 0.4);
    align-self: flex-start;
    max-width: 75%;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1);
  }

  .message-label {
    font-family: 'Syne Mono', monospace;
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: #9CA3AF;
    opacity: 0.9;
  }

  .message.user .message-label {
    color: #FB923C;
    text-shadow: 0 0 10px rgba(251, 146, 60, 0.3);
  }

  .message.assistant .message-label {
    color: #EF4444;
    text-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
  }

  .message-content {
    font-size: 1.1rem;
    line-height: 1.7;
    color: #F3F4F6;
    word-wrap: break-word;
    font-weight: 400;
  }

  .message.user .message-content {
    font-weight: 600;
  }

  .message.assistant .message-content {
    font-weight: 400;
    opacity: 0.95;
  }

  /* Loading animation */
  .message.loading .message-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .glitch {
    font-family: 'Syne Mono', monospace;
    font-size: 0.875rem;
    font-weight: 700;
    text-transform: uppercase;
    color: #EF4444;
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  /* Scrollbar styling */
  .chat-messages::-webkit-scrollbar {
    width: 10px;
  }

  .chat-messages::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.4);
    border-radius: 10px;
  }

  .chat-messages::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(251, 146, 60, 0.5), rgba(251, 146, 60, 0.3));
    border-radius: 10px;
    border: 2px solid rgba(0, 0, 0, 0.3);
  }

  .chat-messages::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, rgba(251, 146, 60, 0.7), rgba(251, 146, 60, 0.5));
  }

  /* Responsive */
  @media (max-width: 768px) {
    .chat-container {
      max-height: 90vh;
      border-radius: 12px;
    }

    .chat-header {
      padding: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-content {
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .header-content h2 {
      font-size: 1.1rem;
    }

    .clear-button {
      font-size: 0.65rem;
      padding: 0.4rem 0.75rem;
    }

    .close-button {
      width: 2.5rem;
      height: 2.5rem;
      font-size: 2rem;
    }

    .chat-messages {
      padding: 1.5rem;
      gap: 1.25rem;
    }

    .message {
      padding: 1.25rem;
    }

    .message.user,
    .message.assistant {
      max-width: 85%;
    }

    .message-content {
      font-size: 1rem;
      line-height: 1.6;
    }
  }
</style>