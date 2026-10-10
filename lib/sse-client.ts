/** Read a server-sent-event response, calling onEvent for each `data:` JSON line. Resolves when the stream ends. */
export async function readSse(res: Response, onEvent: (event: { type: string; [key: string]: unknown }) => void): Promise<void> {
  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response body')
  const decoder = new TextDecoder()
  let buffer = ''
  const handle = (line: string) => {
    if (!line.startsWith('data: ')) return
    let event: { type: string; [key: string]: unknown } | null = null
    try { event = JSON.parse(line.slice(6)) } catch { return }
    if (event) onEvent(event)
  }
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) handle(line)
  }
  if (buffer.trim()) handle(buffer.trim())
}
