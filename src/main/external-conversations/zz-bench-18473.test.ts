import { expect, it, vi } from 'vitest'
let visits = 0
let passes = 0
const N = 2000
vi.mock('./external-conversation-links', async (orig) => {
  const real = await orig<Record<string, unknown>>()
  return {
    ...real,
    allLinks: function* () {
      passes++
      for (let i = 0; i < N; i++) {
        visits++
        yield {
          workspace: { worktreeId: 'wt', sshHostId: null },
          link: { source: 'slack', externalId: `x${i}`, sessionId: `s${i}`, agent: 'claude', paneKey: `p${i}`, bot: { kind: 'bot', botId: 'b' }, createdAt: 0 }
        }
      }
    },
    findLinkForPane: () => null
  }
})
const { ConversationEvents } = await import('./external-conversation-events')
it('bench', () => {
  const deps = new Proxy({ now: () => 0, setTimer: () => ({ cancel() {} }), onAgentPaneChange: () => () => {}, onChatNews: () => () => {}, promptStanding: () => 'unknown' } as Record<string, unknown>, {
    get: (t, k) => (k in t ? t[k as string] : () => null)
  })
  const ev = new ConversationEvents(deps as never)
  const K = 10
  const t0 = performance.now()
  for (let i = 0; i < K; i++) ev.watch(() => {})
  const ms = performance.now() - t0
  console.log(`N=${N} K=${K} passes=${passes} linkVisits=${visits} ms=${ms.toFixed(1)}`)
  expect(passes).toBeGreaterThan(0)
})
