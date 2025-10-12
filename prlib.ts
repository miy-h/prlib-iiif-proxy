// module to scrape Presidential Library and handle with [The Internet Imaging Protocol](https://iipimage.sourceforge.io/documentation/protocol)

import * as v from "valibot";

const IipManifestSchema = v.object({
  pgs: v.array(
    v.object({
      m: v.number(),
      d: v.pipe(
        v.array(v.object({ h: v.number(), w: v.number() })),
        v.minLength(1),
      ),
      f: v.string(),
    }),
  ),
});

type IipManifest = v.InferOutput<typeof IipManifestSchema>;

interface PageInfo {
  identifier: string;
  width: number;
  height: number;
}

export interface MetaData {
  title: string;
  pages: PageInfo[];
}

function extractStringPropertyFromJson(html: string, property: string) {
  const originalRegExp =
    /\s*:\s*("(?:[^\\"]|\\["\\/bfnrt]|\\u[0-9a-fA-F]{4})*")/.source;
  const match = new RegExp(`"${property}"${originalRegExp}`).exec(html);
  if (!match) {
    throw new Error();
  }
  return JSON.parse(match[1]) as string;
}

function extractIipMetaDataFromHtml(html: string) {
  const imageDir = extractStringPropertyFromJson(html, "imageDir");
  const iipManifestUrl = extractStringPropertyFromJson(html, "objectData");
  return {
    imageDir,
    iipManifestUrl,
  };
}

async function fetchManifest(url: string): Promise<IipManifest> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error();
  }
  return v.parse(IipManifestSchema, await response.json());
}

function extractTitle(html: string) {
  const match = /<h1 class="page-title">([^<]*)<\/h1>/.exec(html);
  if (!match) {
    return "";
  }
  return match[1];
}

export async function fetchMetaData(itemId: string): Promise<MetaData> {
  const response = await fetch(`https://www.prlib.ru/item/${itemId}`);
  if (!response.ok) {
    throw new Error("item not found");
  }
  const html = await response.text();
  const { imageDir, iipManifestUrl } = extractIipMetaDataFromHtml(html);
  const manifest = await fetchManifest(iipManifestUrl);
  const title = extractTitle(html);
  return {
    title,
    pages: manifest.pgs.map((p) => {
      const maxDimension = p.d.at(-1)!;
      return {
        identifier: `${imageDir.replace(/^\//, "")}/${p.f}`,
        height: maxDimension.h,
        width: maxDimension.w,
      };
    }),
  };
}
