export async function settlePromise<T>(
  promise: Promise<T>,
): Promise<PromiseSettledResult<T>> {
  try {
    const value = await promise;
    return { status: 'fulfilled', value };
  } catch (error) {
    return { status: 'rejected', reason: error };
  }
}
