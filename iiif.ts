// module to handle IIIF

import * as v from "valibot";

function iiifImageBaseUrl(rootUrl: URL, identifier: string) {
  return new URL(`/image/${identifier}`, rootUrl);
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
