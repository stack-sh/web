const sources = import.meta.glob<string>("../../example-corpus/sources/*.stack", {
  query: "?raw",
  import: "default",
})

/** Load the pinned source, never a separately generated image. */
export async function renderExample(filename: string) {
  const loadSource = sources[`../../example-corpus/sources/${filename}`]
  if (!loadSource) throw new Error("Unknown canonical example")
  const [source, engine] = await Promise.all([loadSource(), import("./stack-engine")])
  await engine.initializeStackEngine()
  return engine.renderStack(source)
}
