import { createFileRoute } from "@tanstack/react-router";
import { MODULE_PERMS } from "@/lib/access";
import { ACCESS_HEADER, requirePerm } from "@/lib/access.server";

// Real page screenshots via thum.io (public screenshot service), proxied so the browser gets same-origin bytes.
export const Route = createFileRoute("/api/screenshot")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await requirePerm(MODULE_PERMS.chat, request.headers.get(ACCESS_HEADER));
        } catch (e) {
          return Response.json({ error: e instanceof Error ? e.message : "Access denied" }, { status: 403 });
        }
        let url = "";
        try {
          const body = (await request.json()) as { url?: unknown };
          if (typeof body.url === "string") url = body.url.trim();
        } catch {
          return Response.json({ error: "Invalid request body" }, { status: 400 });
        }
        if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
        try {
          const u = new URL(url);
          if (!/^https?:$/.test(u.protocol) || !u.hostname.includes(".")) throw new Error();
        } catch {
          return Response.json({ error: "Please enter a valid website address." }, { status: 400 });
        }
        const res = await fetch(`https://image.thum.io/get/width/1280/crop/800/noanimate/${url}`);
        const type = res.headers.get("content-type") ?? "";
        if (!res.ok || !type.startsWith("image/")) {
          return Response.json({ error: "Could not capture that page right now." }, { status: 502 });
        }
        return new Response(res.body, { headers: { "Content-Type": type, "Cache-Control": "no-store" } });
      },
    },
  },
});
