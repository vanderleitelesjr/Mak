import { observerFromEnvironment } from '../observer.mjs';

// Plugin.define is an identity helper; a plain definition avoids installing any
// extra packages in the user's project. OpenCode v2 owns the plugin lifecycle.
export default {
  id: 'mrmak-session-observer',
  setup(context) {
    const observe = observerFromEnvironment(context.location.directory);
    const controller = new AbortController();
    void (async () => {
      for await (const event of context.event.subscribe({ signal: controller.signal })) observe(event);
    })().catch(() => { /* Unloading a location closes its event stream. */ });
    return () => controller.abort();
  },
};
