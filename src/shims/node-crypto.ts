import { getRandomValues, randomUUID as expoRandomUUID } from "expo-crypto";

export { getRandomValues };

export function randomUUID() {
  return expoRandomUUID();
}

const runtime = globalThis as any;
runtime.crypto ??= {};
runtime.crypto.getRandomValues ??= getRandomValues;
runtime.crypto.randomUUID ??= randomUUID;
