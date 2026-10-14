import { observerFromEnvironment } from './observer.mjs';

export default async function mrmakObserver({ directory }) {
  const observe = observerFromEnvironment(directory);
  return { event: async ({ event }) => observe(event) };
}
