import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { proxy } from "hono/proxy";
import { createManifest, rewriteIiifImageInfo } from "./iiif.ts";
import { fetchMetaData } from "./iip.ts";

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

app.get("/manifest/:id", async (c) => {
  const id = c.req.param("id");
  const host = c.req.header("Host");
  if (host === undefined) {
    throw new HTTPException(400);
  }
  const metaData = await fetchMetaData(id);
  return c.json(createManifest(new URL("/", c.req.url), id, metaData));
});

export default app;
