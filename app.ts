import { Hono } from "hono";
import { cors } from "hono/cors";
import { proxy } from "hono/proxy";
import { rewriteIiifImageInfo } from "./iiif.ts";

const app = new Hono();

app.use("/manifest/*", cors());

function prlibUrl(path: string): string {
  const url = new URL("https://content.prlib.ru/fcgi-bin/iipsrv.fcgi");
  url.search = `?${new URLSearchParams({ IIIF: path })}`;
  return url.href;
}

app.get("/image/:rest{.+}", async (c) => {
  const url = prlibUrl(`/${c.req.param("rest")}`);
  if (c.req.path.endsWith("/info.json")) {
    const response = await proxy(url);
    if (!response.ok) {
      return response;
    }
    const data = await response.json();
    return new Response(
      JSON.stringify(rewriteIiifImageInfo(new URL("/", c.req.url), data)),
      response,
    );
  }
  return proxy(url);
});

export default app;
