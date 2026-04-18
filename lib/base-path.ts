const ABSOLUTE_URL_RE = /^[a-zA-Z][a-zA-Z\d+\-.]*:/

export function normalizeBasePath(input?: string | null): string {
  if (!input) return ''
  if (input === '/') return ''

  const trimmed = input.trim()
  if (!trimmed) return ''

  const withoutTrailingSlash = trimmed.replace(/\/+$/, '')
  const withLeadingSlash = withoutTrailingSlash.startsWith('/') ? withoutTrailingSlash : `/${withoutTrailingSlash}`
  return withLeadingSlash === '/' ? '' : withLeadingSlash
}

export function getConfiguredBasePath(): string {
  if (typeof document !== 'undefined') {
    const fromDom = document.documentElement.dataset.basePath
    if (fromDom) return normalizeBasePath(fromDom)
  }

  return normalizeBasePath(
    process.env.NEXT_PUBLIC_BASE_PATH ??
      process.env.NEXT_BASE_PATH ??
      process.env.BASE_PATH ??
      '',
  )
}

export function withBasePath(path: string): string {
  if (!path) return path
  if (ABSOLUTE_URL_RE.test(path) || path.startsWith('//') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const basePath = getConfiguredBasePath()

  if (!basePath) return normalizedPath
  if (normalizedPath === basePath || normalizedPath.startsWith(`${basePath}/`)) return normalizedPath
  return `${basePath}${normalizedPath}`
}

export function patchWindowFetchWithBasePath(): (() => void) | void {
  if (typeof window === 'undefined') return

  const currentFetch = window.fetch.bind(window)
  if ((window.fetch as typeof window.fetch & { __openclawBasePathPatched?: boolean }).__openclawBasePathPatched) {
    return
  }

  const patchedFetch: typeof window.fetch = (input, init) => {
    if (typeof input === 'string') {
      return currentFetch(withBasePath(input), init)
    }

    if (input instanceof URL) {
      if (input.origin === window.location.origin) {
        const nextUrl = new URL(input.toString())
        nextUrl.pathname = withBasePath(nextUrl.pathname)
        return currentFetch(nextUrl, init)
      }
      return currentFetch(input, init)
    }

    if (typeof Request !== 'undefined' && input instanceof Request) {
      const currentUrl = new URL(input.url, window.location.origin)
      if (currentUrl.origin === window.location.origin) {
        const nextUrl = `${withBasePath(currentUrl.pathname)}${currentUrl.search}${currentUrl.hash}`
        return currentFetch(new Request(nextUrl, input), init)
      }
    }

    return currentFetch(input, init)
  }

  ;(patchedFetch as typeof patchedFetch & { __openclawBasePathPatched?: boolean }).__openclawBasePathPatched = true
  window.fetch = patchedFetch

  return () => {
    window.fetch = currentFetch
  }
}