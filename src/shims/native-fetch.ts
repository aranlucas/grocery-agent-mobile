import { fetch as expoFetch } from "expo/fetch";

// Install after CopilotKit's polyfills and before any app clients capture fetch.
// Expo handles React Native Request bodies and native response streaming. The
// CopilotKit XHR fallback loses Request bodies and limits streams to 60 seconds.
globalThis.fetch = expoFetch as typeof globalThis.fetch;
