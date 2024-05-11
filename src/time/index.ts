const sleep = async (durationMs: number) =>
  await new Promise<void>((resolve) => setTimeout(() => resolve(), durationMs));

export { sleep };
