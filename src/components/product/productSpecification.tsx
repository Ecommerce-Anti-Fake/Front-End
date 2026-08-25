import type { OfferDetail } from "../../services/product.api";

type ProductSpecificationProps = {
  product: Pick<
    OfferDetail,
    | "gtin"
    | "parcelWeightGrams"
    | "parcelLengthCm"
    | "parcelWidthCm"
    | "parcelHeightCm"
    | "categoryName"
    | "productModelName"
    | "availableQuantity"
  >;
};

export default function ProductSpecification({ product }: ProductSpecificationProps) {
  return (
    <div className="pd-spec">
      <h3>Thông số kỹ thuật</h3>

      <div className="pd-spec-row">
        <span>GTIN</span>
        <b>{product.gtin}</b>
      </div>

      <div className="pd-spec-row">
        <span>Tình trạng</span>
        <b>Mới</b>
      </div>

      <div className="pd-spec-row">
        <span>Khối lượng</span>
        <b>{product.parcelWeightGrams}g</b>
      </div>

      <div className="pd-spec-row">
        <span>Kích thước</span>

        <b>
          {product.parcelLengthCm} x {product.parcelWidthCm} x{" "}
          {product.parcelHeightCm} cm
        </b>
      </div>

      <div className="pd-spec-row">
        <span>Danh mục</span>
        <b>{product.categoryName}</b>
      </div>

      <div className="pd-spec-row">
        <span>Model</span>
        <b>{product.productModelName}</b>
      </div>

      <div className="pd-spec-row">
        <span>Tồn kho</span>
        <b>{product.availableQuantity}</b>
      </div>
    </div>
  );
}
