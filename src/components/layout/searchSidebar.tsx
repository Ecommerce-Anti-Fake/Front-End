import "../../css/components/layout/searchSidebar.css";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export type SearchCategory = {
  id: string | number;
  name: string;
};

type SearchSidebarProps = {
  categories: SearchCategory[];
  basePath?: string;
};

export default function SearchSidebar({
  categories,
  basePath = "/search",
}: SearchSidebarProps) {
  const [fromPrice, setFromPrice] = useState("");
  const [toPrice, setToPrice] = useState("");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const selectedCategoryId = searchParams.get("categoryId");

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setFromPrice(searchParams.get("minPrice") || "");
      setToPrice(searchParams.get("maxPrice") || "");
    });
    return () => {
      active = false;
    };
  }, [searchParams]);

  const navigateWithParams = (params: URLSearchParams) => {
    navigate(`${basePath}?${params.toString()}`);
  };

  const handleCategoryClick = (categoryId: string) => {
    const params = new URLSearchParams(searchParams);

    if (selectedCategoryId === categoryId) {
      params.delete("categoryId");
    } else {
      params.set("categoryId", categoryId);
    }

    navigateWithParams(params);
  };

  const handlePriceRange = (minPrice?: number, maxPrice?: number) => {
    const params = new URLSearchParams(searchParams);

    if (minPrice !== undefined) {
      params.set("minPrice", String(minPrice));
    } else {
      params.delete("minPrice");
    }

    if (maxPrice !== undefined) {
      params.set("maxPrice", String(maxPrice));
    } else {
      params.delete("maxPrice");
    }

    navigateWithParams(params);
  };

  const handleApplyPrice = () => {
    const params = new URLSearchParams(searchParams);

    if (fromPrice.trim()) {
      params.set("minPrice", fromPrice);
    } else {
      params.delete("minPrice");
    }

    if (toPrice.trim()) {
      params.set("maxPrice", toPrice);
    } else {
      params.delete("maxPrice");
    }

    navigateWithParams(params);
  };

  return (
    <aside className="search-sidebar">
      <div className="filter-section">
        <h4>DANH MỤC</h4>

        <div className="s-category-list">
          {categories.map((item) => {
            const categoryId = String(item.id);

            return (
              <button
                type="button"
                key={categoryId}
                className={`s-category-item ${
                  selectedCategoryId === categoryId ? "active" : ""
                }`}
                onClick={() => handleCategoryClick(categoryId)}
              >
                <span>{item.name}</span>
              </button>
            );
          })}

          {categories.length === 0 && (
            <p className="s-category-empty">Chưa có danh mục.</p>
          )}
        </div>
      </div>

      <div className="filter-section">
        <h4>KHOẢNG GIÁ</h4>

        <label>
          <input
            type="radio"
            checked={
              searchParams.get("minPrice") === "0" &&
              searchParams.get("maxPrice") === "2000000"
            }
            onChange={() => handlePriceRange(0, 2000000)}
          />
          Dưới 2 triệu
        </label>

        <label>
          <input
            type="radio"
            checked={
              searchParams.get("minPrice") === "2000000" &&
              searchParams.get("maxPrice") === "5000000"
            }
            onChange={() => handlePriceRange(2000000, 5000000)}
          />
          2 triệu - 5 triệu
        </label>

        <label>
          <input
            type="radio"
            checked={
              searchParams.get("minPrice") === "5000000" &&
              searchParams.get("maxPrice") === "10000000"
            }
            onChange={() => handlePriceRange(5000000, 10000000)}
          />
          5 triệu - 10 triệu
        </label>

        <label>
          <input
            type="radio"
            checked={
              searchParams.get("minPrice") === "10000000" &&
              searchParams.get("maxPrice") === "20000000"
            }
            onChange={() => handlePriceRange(10000000, 20000000)}
          />
          10 triệu - 20 triệu
        </label>

        <label>
          <input
            type="radio"
            checked={
              searchParams.get("minPrice") === "20000000" &&
              !searchParams.get("maxPrice")
            }
            onChange={() => handlePriceRange(20000000)}
          />
          Trên 20 triệu
        </label>

        <div className="price-range">
          <input
            type="number"
            placeholder="Từ"
            className="price-range-from"
            value={fromPrice}
            onChange={(event) => setFromPrice(event.target.value)}
          />
          <input
            type="number"
            placeholder="Đến"
            className="price-range-to"
            value={toPrice}
            onChange={(event) => setToPrice(event.target.value)}
          />
        </div>

        <button className="apply-btn" onClick={handleApplyPrice}>
          Áp dụng
        </button>
      </div>
    </aside>
  );
}
