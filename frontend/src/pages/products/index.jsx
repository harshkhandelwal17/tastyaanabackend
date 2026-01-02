import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams, useSearchParams } from "react-router-dom";

/** Utility */
const formatPrice = (v) => `₹${(v || 0).toFixed(2)}`;

/** GadgetList - use ?tag=mobile or ?tag=second-hand */
export function GadgetList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const tag = searchParams.get("tag") || "mobile";

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    axios
      .get(`/api/products?tag=${encodeURIComponent(tag)}&limit=60`)
      .then((res) => {
        if (!mounted) return;
        setProducts(res.data?.data || res.data || []);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.response?.data?.message || err.message || "Failed to load");
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [tag]);

  if (loading) return <div className="p-6">Loading products…</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!products.length) return <div className="p-6">No products found for "{tag}"</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">{tag === "mobile" ? "Mobiles" : tag}</h1>
        <div className="text-sm text-gray-600">Found {products.length}</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => {
          const primary = (p.images || []).find((i) => i.isPrimary) || (p.images || [])[0];
          return (
            <div key={p._id} className="border rounded-lg overflow-hidden shadow-sm bg-white">
              <Link to={`/products/${p._id}`} className="block">
                <div className="h-48 bg-gray-100 flex items-center justify-center">
                  {primary?.url ? (
                    <img src={primary.url} alt={primary?.alt || p.title} className="max-h-48 object-contain" />
                  ) : (
                    <div className="text-gray-400">No image</div>
                  )}
                </div>
              </Link>

              <div className="p-4">
                <Link to={`/products/${p._id}`} className="block">
                  <h2 className="font-medium text-lg">{p.title}</h2>
                </Link>

                <div className="text-sm text-gray-500 mt-1">{p.shortDescription || (p.description || "").slice(0, 80)}</div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-lg font-semibold text-amber-700">{formatPrice(p.price)}</div>
                  <Link to={`/products/${p._id}`} className="text-sm text-blue-600 hover:underline">
                    View
                  </Link>
                </div>

                <div className="mt-2 text-xs text-gray-600">
                  {(p.tags || []).slice(0, 3).join(", ")}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** GadgetDetail */
export function GadgetDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    axios
      .get(`/api/products/${id}`)
      .then((res) => mounted && setProduct(res.data?.data || res.data))
      .catch((err) => mounted && setError(err?.response?.data?.message || err.message))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!product) return <div className="p-6">Product not found</div>;

  const primary = (product.images || []).find((i) => i.isPrimary) || (product.images || [])[0];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="bg-gray-100 h-80 flex items-center justify-center rounded">
            {primary?.url ? (
              <img src={primary.url} alt={primary.alt || product.title} className="max-h-80 object-contain" />
            ) : (
              <div className="text-gray-400">No image</div>
            )}
          </div>

          {product.images && product.images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-auto">
              {product.images.map((img, i) => (
                <img key={i} src={img.url} alt={img.alt || product.title} className="w-20 h-20 object-cover rounded border" />
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-semibold">{product.title}</h1>
          <div className="text-sm text-gray-600 mt-1">{product.subCategory || (product.tags || []).join(", ")}</div>

          <div className="mt-3 flex items-baseline gap-3">
            <div className="text-3xl font-bold text-amber-700">{formatPrice(product.price)}</div>
            {product.discountPrice && <div className="text-sm line-through text-gray-400">{formatPrice(product.discountPrice)}</div>}
          </div>

          <div className="mt-4 text-gray-700">{product.description}</div>

          <div className="mt-4">
            <h3 className="font-medium">Specifications</h3>
            <ul className="mt-2 text-sm text-gray-700 list-disc pl-5">
              {(product.specifications || []).slice(0, 10).map((s, i) => (
                <li key={i}>
                  {s.name}: {s.value}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4">
            <h3 className="font-medium">Condition</h3>
            <div className="text-sm text-gray-700">{(product.tags || []).includes("second-hand") ? "Second-hand / Used" : "New"}</div>
          </div>

          <div className="mt-6 flex gap-3">
            <button className="px-4 py-2 bg-amber-600 text-white rounded">Buy Now</button>
            <button className="px-4 py-2 border rounded">Add to Cart</button>
            <Link to="/products?tag=second-hand" className="ml-auto text-sm text-blue-600">
              Browse used
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GadgetList;