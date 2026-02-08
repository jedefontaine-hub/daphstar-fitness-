import '@testing-library/jest-dom'

// Mock crypto.randomUUID for Node.js test environment
if (typeof crypto === 'undefined' || !crypto.randomUUID) {
  global.crypto = {
    ...global.crypto,
    randomUUID: () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    },
  } as Crypto
}

// Reset any global state between tests
beforeEach(() => {
  // Clear any mocks
  vi.clearAllMocks()
})
