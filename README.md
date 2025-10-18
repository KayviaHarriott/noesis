# noesis
Intellibus AI Hackathon entry
Real-time AI support that shortens hold time, detects frustration early, and guides agents to better outcomes on every call.

# Getting Started 🚀

## Backend
The backend is built with NodeJS and communicates with an Ollama on runpod. To start the backend:

1. Create the env file in the base of the repo, clone the information in the .env.sample and fill in the information for routes.
```

```

2. Install dependencies
```
npm i
```
2. Start up the backend
```
node server/index.js
``` 
<br><br>

## Frontend
The frontend is built with React-Vite with TypeScript, the first thing we're going to do is start it up.

1. Create the env file in the base of the repo, clone the information in the .env.sample and fill in the information for routes.
```

```
2. Navigate into noesis-web
```
cd noesis-web
```
3. Install dependencies
```
npm i
```
4. Start up the project
```
npm run dev
```

## AI
The AI will be done with Ollama and ran on RunPod server, but if you would like to run it locally:
1. Install Ollama
```
curl -fsSL https://ollama.com/install.sh | sh

```
2. Start up the AI:
```
ollama serve
```

<br><br>

# Updates 🏃‍♀️💨

To update both the backend and frontend, ensure dependencies are installed each time.

1. Frontend:
```
npm i
```

2. Backend:
```
npm i
```
