// module to handle IIIF

import * as v from "valibot";
import type { Canvas, Manifest } from "@iiif/presentation-3";
import { MetaData } from "./prlib.ts";

function manifestUrl(rootUrl: URL, itemId: string) {
  return new URL(`/manifest/${itemId}`, rootUrl);
}

function canvasUrl(rootUrl: URL, itemId: string, canvasId: string) {
  return new URL(`/${itemId}/${canvasId}`, rootUrl);
}

function annotationPageUrl(rootUrl: URL, itemId: string, canvasId: string) {
  return new URL(`/${itemId}/${canvasId}/0`, rootUrl);
}

function annotationUrl(rootUrl: URL, itemId: string, canvasId: string) {
  return new URL(`/${itemId}/${canvasId}/0/0`, rootUrl);
}

function iiifImageBaseUrl(rootUrl: URL, identifier: string) {
  return new URL(`/image/${identifier}`, rootUrl);
}

function iiifImageUrl(
  rootUrl: URL,
  identifier: string,
  region = "full",
  size = "max",
  rotation = 0,
  quality = "default",
  format = "jpg",
) {
  return new URL(
    `/image/${identifier}/${region}/${size}/${rotation.toString()}/${quality}.${format}`,
    rootUrl,
  );
}

function createLabelForCanvas(index: number): Canvas["label"] {
  return {
    en: [`page ${(index + 1).toString()}`],
  };
}

/**
 * Create a manifest compliant with IIIF Presentation API v3
 */
export function createManifest(
  rootUrl: URL,
  itemId: string,
  metaData: MetaData,
): Manifest {
  return {
    "@context": "http://iiif.io/api/presentation/3/context.json",
    id: manifestUrl(rootUrl, itemId).href,
    type: "Manifest",
    label: {
      none: [metaData.title],
    },
    items: metaData.pages.map((page, index) => ({
      id: canvasUrl(rootUrl, itemId, index.toString()).href,
      type: "Canvas",
      width: page.width,
      height: page.height,
      label: createLabelForCanvas(index),
      items: [{
        id: annotationPageUrl(rootUrl, itemId, index.toString()).href,
        type: "AnnotationPage",
        items: [{
          id: annotationUrl(rootUrl, itemId, index.toString()).href,
          type: "Annotation",
          motivation: "painting",
          body: {
            id: iiifImageUrl(rootUrl, page.identifier).href,
            type: "Image",
            format: "image/jpeg",
            width: page.width,
            height: page.height,
            service: [{
              id: iiifImageBaseUrl(rootUrl, page.identifier).href,
              type: "ImageService3",
              profile: "level2",
            }],
          },
          target: canvasUrl(rootUrl, itemId, index.toString()).href,
        }],
      }],
    })),
  };
}

const ImageInfoSchema = v.looseObject({
  id: v.string(),
});

export function rewriteIiifImageInfo(rootUrl: URL, info: unknown): unknown {
  const validatedInfo = v.parse(ImageInfoSchema, info);
  const originalIiifUrl = new URL(validatedInfo.id).searchParams.get("IIIF");
  if (originalIiifUrl === null) {
    throw new Error();
  }
  // `id` returned from server is wrong (I don't know why)
  const identifier = originalIiifUrl.replace(/%%2$/, "").replace(/^\//, "");
  return {
    ...validatedInfo,
    id: iiifImageBaseUrl(rootUrl, identifier),
  };
}
