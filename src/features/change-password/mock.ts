export const MOCK_NETWORK_DELAY_MS = 700

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

