# ai-discord-bot

A Discord bot powered by artificial intelligence that can interact with users through natural language, featuring voice capabilities and advanced chat features.

## Features

- **Natural Language Chat**
  - AI-powered conversations using HuggingFace models
  - Multiple chat models support (Phi-3, SeaLLMs)
  - Automatic language translation support
  - Responds to mentions and replies

- **Voice Features**
  - Text-to-Speech (TTS) capabilities
  - Multiple TTS providers (Google TTS, ElevenLabs)
  - Voice channel join/leave commands
  - Cached audio responses for better performance

- **Command System**
  - `/chat` - Start an AI conversation with model selection
  - `/tts` - Convert text to speech
  - `/join` - Join voice channel
  - `/leave` - Leave voice channel
  - `/ping` - Check bot latency
  - `/invite` - Get bot invitation link

- **Safety Features**
  - Profanity filtering
  - Text cleaning and normalization
  - Rate limiting
  - Error handling

## Prerequisites

- Node.js 16.x or higher
- Discord Bot Token
- HuggingFace API Token
- ElevenLabs API Key (optional, for premium TTS)
- Supabase Account (for TTS caching)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Jersk41/ai-discord-bot.git
cd ai-discord-bot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with required credentials:
```env
ENV=dev
DISCORD_TOKEN=your_discord_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
HF_TOKEN=your_huggingface_token
ELEVENLABS_API_KEY=your_elevenlabs_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
```

## Usage

1. Start the bot in development mode:
```bash
npm run dev
```

Or for production:
```bash
npm start
```

2. Deploy slash commands:
```bash
npm run deploy:command
```

3. Available Commands:
- `/chat [message] [model]` - Chat with AI using selected model
- `/tts [message] [model]` - Convert text to speech
- `/join` - Join your current voice channel
- `/leave` - Leave voice channel
- `/ping` - Check bot response time
- `/invite` - Get bot invitation link

## Development

- Run tests: `npm test`
- Run linter: `npm run lint`
- Fix linting issues: `npm run lint:fix`
- Watch tests: `npm run test:watch`

## Configuration

The bot can be configured through:
- Environment variables (`.env` file)
- Supabase configuration (`supabase/config.toml`)
- Word filter lists (`src/utils/wordlists.json`)

## License
This project is licensed under the MIT License - see the LICENSE file for details.