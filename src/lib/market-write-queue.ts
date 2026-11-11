// Serialize local storage operations through admission and settlement. Each call
// retains its full conservative reservation; concurrent writes must not reserve
// the same process's worst-case allowance several times at once.
let tail = Promise.resolve();
export async function withMarketWriteTurn<T>(
  work: () => Promise<T>,
): Promise<T> {
  const previous = tail;
  let release!: () => void;
  tail = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    return await work();
  } finally {
    release();
  }
}
