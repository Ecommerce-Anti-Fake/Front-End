import assert from "node:assert/strict";
import test from "node:test";
import { getOptimizedImageUrl } from "../src/services/image-delivery.ts";

test("adds a bounded Cloudinary delivery transform before the asset version", () => {
  const source =
    "https://res.cloudinary.com/antifake/image/upload/v1730000000/products/shoe.jpg";

  assert.equal(
    getOptimizedImageUrl(source, 320),
    "https://res.cloudinary.com/antifake/image/upload/f_auto,q_auto,w_320,c_limit/v1730000000/products/shoe.jpg",
  );
});

test("does not rewrite non-Cloudinary URLs or change their extension", () => {
  const urls = [
    "https://cdn.example.test/products/shoe.jpg",
    "https://example.test/products/shoe.png",
    "https://res.cloudinary.com/antifake/raw/upload/v1/file.pdf",
  ];

  for (const source of urls) {
    assert.equal(getOptimizedImageUrl(source, 320), source);
  }
});

test("does not duplicate an existing Cloudinary transformation", () => {
  const source =
    "https://res.cloudinary.com/antifake/image/upload/f_auto,q_auto,w_320,c_limit/v1730000000/products/shoe.jpg";

  assert.equal(getOptimizedImageUrl(source, 320), source);
});

test("keeps query strings and hashes on optimized URLs", () => {
  const source =
    "https://res.cloudinary.com/antifake/image/upload/v1730000000/products/shoe.jpg?cache=1#preview";

  assert.equal(
    getOptimizedImageUrl(source, 160),
    "https://res.cloudinary.com/antifake/image/upload/f_auto,q_auto,w_160,c_limit/v1730000000/products/shoe.jpg?cache=1#preview",
  );
});
