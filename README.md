# Japanese Speaking MVP

Next.js MVP for Japanese spoken-output practice. Learning progress and chat sessions are saved in the user's browser `localStorage`.

## Local Development

```bash
npm install
npm run dev
```

Create `.env.local` from `.env.local.example`:

```bash
DEEPSEEK_API_KEY=your_deepseek_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_NAME=Shizuka
# Optional, use this when voice search does not find Shizuka in your account.
ELEVENLABS_VOICE_ID=your_elevenlabs_voice_id
```

## Deploy

This project uses Next.js API routes to call DeepSeek, so GitHub Pages is not enough for the full app. Put the code on GitHub, then deploy it with Vercel.

1. Create a new GitHub repository.
2. Upload or push this project source code. Do not upload `.env.local`.
3. Import the GitHub repository in Vercel.
4. Add this Vercel environment variable:

```bash
DEEPSEEK_API_KEY=your_deepseek_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_NAME=Shizuka
```

5. Deploy.

The app does not need a database for the current MVP. Each user's progress stays in their own browser.
