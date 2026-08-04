const CLOUDINARY_HOST = "res.cloudinary.com";
const TRANSFORMATION_PREFIXES = [
  "a_",
  "ar_",
  "b_",
  "bo_",
  "c_",
  "d_",
  "e_",
  "fl_",
  "f_",
  "g_",
  "h_",
  "o_",
  "q_",
  "r_",
  "t_",
  "w_",
  "x_",
  "y_",
  "z_",
];

function isTransformationSegment(segment: string): boolean {
  return segment
    .split(",")
    .some((token) =>
      TRANSFORMATION_PREFIXES.some((prefix) => token.startsWith(prefix)),
    );
}

export function getOptimizedImageUrl(source: string, width: number): string {
  if (!source || !Number.isFinite(width) || width <= 0) return source;

  let url: URL;
  try {
    url = new URL(source);
  } catch {
    return source;
  }

  if (url.protocol !== "https:" || url.hostname !== CLOUDINARY_HOST) {
    return source;
  }

  const pathSegments = url.pathname.split("/");
  const uploadIndex = pathSegments.findIndex(
    (segment, index) =>
      segment === "image" && pathSegments[index + 1] === "upload",
  );
  if (uploadIndex < 0) return source;

  const assetSegments = pathSegments.slice(uploadIndex + 2);
  if (!assetSegments.length || isTransformationSegment(assetSegments[0])) {
    return source;
  }

  const optimizedWidth = Math.max(1, Math.round(width));
  const transformation = `f_auto,q_auto,w_${optimizedWidth},c_limit`;
  url.pathname = [
    ...pathSegments.slice(0, uploadIndex + 2),
    transformation,
    ...assetSegments,
  ].join("/");

  return url.href;
}
