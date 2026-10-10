/** Parse a fetch Response as JSON; when the server sent something else (a platform error page), say so plainly. */
export async function readJson<T = any>(res: Response): Promise<T> {
  const text = await res.text()
  try {
    return JSON.parse(text) as T
  } catch {
    const timedOut = res.status === 504 || /timed? ?out|FUNCTION_INVOCATION_TIMEOUT/i.test(text)
    throw new Error(
      timedOut
        ? 'That took too long. Please try again, or remove the portfolio link and retry with just your resume.'
        : 'The server had a problem. Please try again in a moment.',
    )
  }
}
