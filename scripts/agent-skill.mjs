import assert from "node:assert/strict"
import { createHash } from "node:crypto"

export const agentSkill = {
  repository: "stack-sh/cli",
  revision: "2ffeff8a547f0c82dd70d98e6e1945dc5dd03365",
  path: "skills/stack-diagrams/SKILL.md",
  sha256: "1336fbf606df083c842c0b8decdf81e73b11ec237e62e8462da0896b44456082",
}

export async function readAgentSkill(lock = agentSkill, fetchResource = fetch) {
  assert.equal(lock.repository, "stack-sh/cli")
  assert.match(lock.revision, /^[a-f0-9]{40}$/)
  assert.equal(lock.path, "skills/stack-diagrams/SKILL.md")
  assert.match(lock.sha256, /^[a-f0-9]{64}$/)
  const url = `https://raw.githubusercontent.com/${lock.repository}/${lock.revision}/${lock.path}`
  const response = await fetchResource(url, { signal: AbortSignal.timeout(15_000) })
  assert.ok(response.ok, `Unable to retrieve pinned agent skill: HTTP ${response.status}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    lock.sha256,
    "Agent skill integrity mismatch",
  )
  return bytes.toString("utf8")
}
