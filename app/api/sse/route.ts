import { eventBus } from "@/lib/event-bus";
import type { LiveUpdatePayload } from "@/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let isOpen = true;

      const send = (payload: LiveUpdatePayload) => {
        if (!isOpen) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
          );
        } catch (e) {
          // Ignore if controller is closed
        }
      };

      send({ type: "status", stats: { totalDevices: 0, online: 0, offline: 0, averageLatency: null } });

      const unsubscribe = eventBus.subscribe(send);

      const heartbeat = setInterval(() => {
        if (!isOpen) return;
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch (e) {
          // Ignore if controller is closed
        }
      }, 15000);

      const cleanup = () => {
        isOpen = false;
        clearInterval(heartbeat);
        unsubscribe();
      };

      // @ts-expect-error - store cleanup on controller for cancel
      controller._cleanup = cleanup;
    },
    cancel(controller) {
      // @ts-expect-error - cleanup stored on controller
      controller._cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
