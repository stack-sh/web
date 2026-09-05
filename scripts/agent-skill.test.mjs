import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import test from "node:test"
import { agentSkill, readAgentSkill } from "./agent-skill.mjs"

const source = "verified skill fixture\n"
const lock = {
  ...agentSkill,
  revision: "a".repeat(40),
  sha256: createHash("sha256").update(source).digest("hex"),
}

test("skill retrieval uses an immutable owner URL and verifies exact bytes", async () => {
  const result = await readAgentSkill(lock, async (url) => {
    assert.equal(
      url,
      `https://raw.githubusercontent.com/stack-sh/cli/${lock.revision}/skills/stack-diagrams/SKILL.md`,
    )
    return new Response(source)
  })
  assert.equal(result, source)
})

test("skill retrieval rejects mutable revisions, missing resources, and altered bytes", async () => {
  await assert.rejects(readAgentSkill({ ...lock, revision: "main" }))
  await assert.rejects(
    readAgentSkill(lock, async () => new Response("missing", { status: 404 })),
    /HTTP 404/,
  )
  await assert.rejects(
    readAgentSkill(lock, async () => new Response(source + "changed")),
    /integrity mismatch/,
  )
})
