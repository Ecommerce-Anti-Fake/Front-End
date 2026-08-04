import type { ImgHTMLAttributes } from "react";
import { getOptimizedImageUrl } from "../../services/image-delivery";

type MediaThumbnailProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "width" | "height" | "loading" | "decoding"
> & {
  src: string;
  width: number;
  height?: number;
  loading?: "lazy" | "eager";
};

export default function MediaThumbnail({
  src,
  width,
  height = width,
  loading = "lazy",
  ...props
}: MediaThumbnailProps) {
  return (
    <img
      {...props}
      src={getOptimizedImageUrl(src, width)}
      width={width}
      height={height}
      loading={loading}
      {...(loading === "lazy" ? { decoding: "async" as const } : {})}
    />
  );
}
