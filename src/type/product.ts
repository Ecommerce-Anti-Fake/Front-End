import type { ShippingMethod } from "./shipping";

export type Product = {
  id: string;
  name: string;
  image: string;
  price: number;
  oldPrice?: number;
  soldQuantity: number;
  availableQuantity: number;
};

export type ProductView = {
  id: string;
  title: string;
  price: number;
  currency: string;
  thumbnailUrl: string;
  soldQuantity: number;
  availableQuantity?: number;
  categoryName: string;
  salesMode: "WHOLESALE" | "RETAIL";
  verificationLevel: string;
  offerStatus: string;
  brandId: string;
  shopId: string;
};

export interface ProductDetail {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  salesMode: string;
  minWholesaleQty: number;
  itemCondition: string;
  availableQuantity: number;
  soldQuantity: number;
  parcelWeightGrams: number;
  parcelLengthCm: number;
  parcelWidthCm: number;
  parcelHeightCm: number;
  verificationLevel: string;
  verificationPolicy: string;
  offerStatus: string;
  categoryId: string;
  categoryName: string;
  brandId: string;
  gtin: number;
  distributionNodeId: string;
  distributionNetworkId: string;
  productModelName: string;
  thumbnailUrl: string;
  shippingMethods: ShippingMethod[];
  createdAt: string;
}
