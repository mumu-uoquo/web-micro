import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createRequest, setGlobalTokenGetter } from './index.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Capture the last request interceptor registered on an axios instance */
function getRequestHandler(instance) {
  // axios stores handlers in instance.interceptors.request.handlers
  const handlers = instance.interceptors.request.handlers
  return handlers[handlers.length - 1].fulfilled
}

/** Capture the last response error handler registered on an axios instance */
function getResponseErrorHandler(instance) {
  const handlers = instance.interceptors.response.handlers
  return handlers[handlers.length - 1].rejected
}

// ---------------------------------------------------------------------------
// Tests: timeout validation
// ---------------------------------------------------------------------------

describe('createRequest – timeout validation (Req 1.12)', () => {
  it('accepts the minimum boundary (100 ms)', () => {
    expect(() => createRequest({ timeout: 100 })).not.toThrow()
  })

  it('accepts the maximum boundary (60000 ms)', () => {
    expect(() => createRequest({ timeout: 60000 })).not.toThrow()
  })

  it('accepts a value in the middle of the range (10000 ms)', () => {
    expect(() => createRequest({ timeout: 10000 })).not.toThrow()
  })

  it('throws when timeout < 100 ms', () => {
    expect(() => createRequest({ timeout: 99 })).toThrow('timeout 必须在 100ms ~ 60000ms 范围内')
  })

  it('throws when timeout > 60000 ms', () => {
    expect(() => createRequest({ timeout: 60001 })).toThrow('timeout 必须在 100ms ~ 60000ms 范围内')
  })

  it('throws when timeout is 0', () => {
    expect(() => createRequest({ timeout: 0 })).toThrow()
  })

  it('uses default timeout (10000) when not specified', () => {
    // Should not throw; default is within range
    expect(() => createRequest({})).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// Tests: request interceptor – token injection (Req 1.13, 1.14)
// ---------------------------------------------------------------------------

describe('createRequest – request interceptor', () => {
  beforeEach(() => {
    // Reset global token getter and localStorage before each test
    setGlobalTokenGetter(null)
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue(null),
      removeItem: vi.fn(),
      setItem: vi.fn()
    })
  })

  it('attaches Authorization header when Global_State token is available (Req 1.13)', async () => {
    setGlobalTokenGetter(() => 'gs-token-abc')
    const instance = createRequest({ timeout: 5000 })
    const handler = getRequestHandler(instance)

    const cfg = { headers: {} }
    const result = await handler(cfg)

    expect(result.headers['Authorization']).toBe('Bearer gs-token-abc')
  })

  it('attaches Authorization header from localStorage when no Global_State token (Req 1.13)', async () => {
    setGlobalTokenGetter(null)
    localStorage.getItem.mockReturnValue('ls-token-xyz')

    const instance = createRequest({ timeout: 5000 })
    const handler = getRequestHandler(instance)

    const cfg = { headers: {} }
    const result = await handler(cfg)

    expect(result.headers['Authorization']).toBe('Bearer ls-token-xyz')
  })

  it('prefers Global_State token over localStorage token (Req 1.13)', async () => {
    setGlobalTokenGetter(() => 'gs-token-primary')
    localStorage.getItem.mockReturnValue('ls-token-secondary')

    const instance = createRequest({ timeout: 5000 })
    const handler = getRequestHandler(instance)

    const cfg = { headers: {} }
    const result = await handler(cfg)

    expect(result.headers['Authorization']).toBe('Bearer gs-token-primary')
  })

  it('does NOT add Authorization header when no token is available (Req 1.14)', async () => {
    setGlobalTokenGetter(null)
    localStorage.getItem.mockReturnValue(null)

    const instance = createRequest({ timeout: 5000 })
    const handler = getRequestHandler(instance)

    const cfg = { headers: {} }
    const result = await handler(cfg)

    expect(result.headers['Authorization']).toBeUndefined()
  })

  it('does NOT throw when no token is available – request proceeds normally (Req 1.14)', async () => {
    setGlobalTokenGetter(null)
    localStorage.getItem.mockReturnValue(null)

    const instance = createRequest({ timeout: 5000 })
    const handler = getRequestHandler(instance)

    const cfg = { headers: {} }
    const result = handler(cfg)
    // The handler returns the config object synchronously (not a Promise)
    expect(result).toBeDefined()
    expect(result.headers).toBeDefined()
  })

  it('does NOT add Authorization header when Global_State getter returns null (Req 1.14)', async () => {
    setGlobalTokenGetter(() => null)
    localStorage.getItem.mockReturnValue(null)

    const instance = createRequest({ timeout: 5000 })
    const handler = getRequestHandler(instance)

    const cfg = { headers: {} }
    const result = await handler(cfg)

    expect(result.headers['Authorization']).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Tests: response interceptor (Req 1.12)
// ---------------------------------------------------------------------------

describe('createRequest – response interceptor', () => {
  beforeEach(() => {
    setGlobalTokenGetter(null)
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue(null),
      removeItem: vi.fn(),
      setItem: vi.fn()
    })
    vi.stubGlobal('window', {
      location: { href: '' }
    })
  })

  it('resolves with response.data on success', async () => {
    const instance = createRequest({ timeout: 5000 })
    const successHandler = instance.interceptors.response.handlers[0].fulfilled

    const fakeResponse = { data: { id: 1, name: 'test' }, status: 200 }
    const result = await successHandler(fakeResponse)

    expect(result).toEqual({ id: 1, name: 'test' })
  })

  it('rejects with the error for non-2xx responses (Req 1.12)', async () => {
    const instance = createRequest({ timeout: 5000 })
    const errorHandler = getResponseErrorHandler(instance)

    const error = { response: { status: 500 }, message: 'Server Error' }
    await expect(errorHandler(error)).rejects.toEqual(error)
  })

  it('rejects with the error for 404 responses (Req 1.12)', async () => {
    const instance = createRequest({ timeout: 5000 })
    const errorHandler = getResponseErrorHandler(instance)

    const error = { response: { status: 404 }, message: 'Not Found' }
    await expect(errorHandler(error)).rejects.toEqual(error)
  })

  it('clears auth_token and redirects to /login on 401 (Req 1.12)', async () => {
    const instance = createRequest({ timeout: 5000 })
    const errorHandler = getResponseErrorHandler(instance)

    const error = { response: { status: 401 }, message: 'Unauthorized' }
    await expect(errorHandler(error)).rejects.toEqual(error)

    expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token')
    expect(window.location.href).toBe('/login')
  })

  it('still rejects the promise after 401 cleanup (Req 1.12)', async () => {
    const instance = createRequest({ timeout: 5000 })
    const errorHandler = getResponseErrorHandler(instance)

    const error = { response: { status: 401 }, message: 'Unauthorized' }
    // Must still reject even after side-effects
    await expect(errorHandler(error)).rejects.toBeDefined()
  })

  it('does NOT redirect on 500 errors', async () => {
    const instance = createRequest({ timeout: 5000 })
    const errorHandler = getResponseErrorHandler(instance)

    const error = { response: { status: 500 }, message: 'Server Error' }
    await expect(errorHandler(error)).rejects.toBeDefined()

    expect(window.location.href).not.toBe('/login')
  })
})

// ---------------------------------------------------------------------------
// Tests: setGlobalTokenGetter
// ---------------------------------------------------------------------------

describe('setGlobalTokenGetter', () => {
  beforeEach(() => {
    setGlobalTokenGetter(null)
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue(null),
      removeItem: vi.fn(),
      setItem: vi.fn()
    })
  })

  it('allows the getter to be replaced mid-lifecycle', async () => {
    setGlobalTokenGetter(() => 'first-token')
    const instance = createRequest({ timeout: 5000 })
    const handler = getRequestHandler(instance)

    // Now update the getter
    setGlobalTokenGetter(() => 'second-token')

    const cfg = { headers: {} }
    const result = await handler(cfg)

    // The interceptor closure reads _getGlobalToken at call time, so it picks up the latest
    expect(result.headers['Authorization']).toBe('Bearer second-token')
  })
})
