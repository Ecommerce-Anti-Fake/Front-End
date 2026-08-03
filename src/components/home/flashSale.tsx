import { Flame } from "lucide-react";
import "../../css/components/flashSale.css";
import type { Product, ProductView } from "../../type/product";
import ProductSell from "../product/productSale";

type Props = {
  products: ProductView[];
};

function toFlashSaleProduct(product: ProductView): Product {
  return {
    id: product.id,
    name: product.title,
    image: product.thumbnailUrl || `https://picsum.photos/seed/${product.id}/640/640`,
    price: Number(product.price ?? 0),
    soldQuantity: Number(product.soldQuantity ?? 0),
    availableQuantity: Number(product.availableQuantity ?? 0),
  };
}

export default function FlashSale({ products }: Props) {
  const flashProducts = products
    .filter((product) => Number(product.price) > 0)
    .slice(0, 5)
    .map(toFlashSaleProduct);

  return (
    <section className="flash-sale">
      <div className="flash-header">
        <div className="flash-left">
          <Flame size={27} />
          <h2>Flash Sale</h2>
        </div>
        <button className="view-all">Xem tất cả</button>
      </div>

      <div className="flash-products">
        {flashProducts.length ? (
          flashProducts.map((product) => <ProductSell key={product.id} product={product} />)
        ) : (
          <p>Chưa có sản phẩm đang bán.</p>
        )}
      </div>

      <div className="view-all-wrapper">
        <button className="view-all-bottom">Xem tất cả</button>
      </div>
    </section>
  );
}
