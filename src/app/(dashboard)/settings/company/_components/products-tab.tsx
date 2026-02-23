"use client";

import {
  Save,
  Loader2,
  Plus,
  Trash2,
  Package,
  ChevronDown,
  ChevronRight,
  Pencil,
  X,
} from "lucide-react";
import { Product, ProductCapability, OUTCOME_OPTIONS } from "./types";

interface ProductsTabProps {
  products: Product[];
  expandedProducts: Set<string>;
  editingProduct: string | null;
  productForm: {
    product_name: string;
    service_line: string;
    description: string;
    capabilities: ProductCapability[];
  };
  showAddProduct: boolean;
  productSaving: boolean;
  services: string[];
  resetProductForm: () => void;
  setShowAddProduct: (value: boolean) => void;
  setProductForm: (value: {
    product_name: string;
    service_line: string;
    description: string;
    capabilities: ProductCapability[];
  }) => void;
  startEditProduct: (product: Product) => void;
  handleSaveProduct: () => void;
  handleDeleteProduct: (id: string) => void;
  toggleProductExpand: (id: string) => void;
  addCapability: () => void;
  updateCapability: (index: number, field: string, value: unknown) => void;
  removeCapability: (index: number) => void;
  toggleOutcome: (capIndex: number, outcome: string) => void;
}

export function ProductsTab({
  products,
  expandedProducts,
  editingProduct,
  productForm,
  showAddProduct,
  productSaving,
  services,
  resetProductForm,
  setShowAddProduct,
  setProductForm,
  startEditProduct,
  handleSaveProduct,
  handleDeleteProduct,
  toggleProductExpand,
  addCapability,
  updateCapability,
  removeCapability,
  toggleOutcome,
}: ProductsTabProps) {
  return (
    <div className="space-y-4">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-[var(--foreground)]">
            Products & Services
          </h3>
          <p className="text-sm text-[var(--foreground-muted)]">
            Define your products, service lines, and capabilities to
            include in proposals.
          </p>
        </div>
        {!showAddProduct && !editingProduct && (
          <button
            onClick={() => {
              resetProductForm();
              setShowAddProduct(true);
            }}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        )}
      </div>

      {/* Add/Edit Product Form */}
      {(showAddProduct || editingProduct) && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-[var(--foreground)]">
              {editingProduct ? "Edit Product" : "New Product"}
            </h4>
            <button
              onClick={resetProductForm}
              className="p-1 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={productForm.product_name}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      product_name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                  placeholder="e.g., Cloud Migration Services"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Service Line
                </label>
                <input
                  type="text"
                  value={productForm.service_line}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      service_line: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                  placeholder="e.g., cloud, data_ai, cybersecurity"
                  list="service-line-suggestions"
                />
                {services.length > 0 && (
                  <datalist id="service-line-suggestions">
                    {services.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Description
              </label>
              <textarea
                value={productForm.description}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    description: e.target.value,
                  })
                }
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent resize-none"
                placeholder="Describe this product or service offering..."
              />
            </div>

            {/* Capabilities */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-[var(--foreground)]">
                  Capabilities ({productForm.capabilities.length})
                </label>
                <button
                  onClick={addCapability}
                  className="text-sm text-[var(--accent)] hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Capability
                </button>
              </div>

              <div className="space-y-3">
                {productForm.capabilities.map((cap, ci) => (
                  <div
                    key={ci}
                    className="p-3 rounded-lg border border-[var(--border)] bg-[var(--background-secondary)]"
                  >
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={cap.name}
                        onChange={(e) =>
                          updateCapability(ci, "name", e.target.value)
                        }
                        className="flex-1 px-3 py-1.5 rounded border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:ring-1 focus:ring-[var(--accent)]"
                        placeholder="Capability name"
                      />
                      <button
                        onClick={() => removeCapability(ci)}
                        className="p-1 text-[var(--foreground-muted)] hover:text-[var(--error)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <textarea
                      value={cap.description}
                      onChange={(e) =>
                        updateCapability(ci, "description", e.target.value)
                      }
                      rows={2}
                      className="w-full px-3 py-1.5 rounded border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm resize-none focus:ring-1 focus:ring-[var(--accent)] mb-2"
                      placeholder="Describe this capability..."
                    />
                    <div>
                      <span className="text-xs text-[var(--foreground-muted)] mb-1 block">
                        Outcomes:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {OUTCOME_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => toggleOutcome(ci, opt.value)}
                            className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                              cap.outcomes.includes(opt.value)
                                ? "bg-[var(--accent)] text-black border-[var(--accent)]"
                                : "border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--accent)]"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={resetProductForm} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={productSaving || !productForm.product_name.trim()}
                className="btn-primary"
              >
                {productSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {editingProduct ? "Update Product" : "Save Product"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product List */}
      {products.length === 0 && !showAddProduct && (
        <div className="card p-8 text-center">
          <Package className="h-12 w-12 text-[var(--foreground-subtle)] mx-auto mb-3" />
          <p className="text-[var(--foreground-muted)]">
            No products or services defined yet.
          </p>
          <p className="text-sm text-[var(--foreground-subtle)] mt-1">
            Add your products and capabilities so they appear in your
            proposals.
          </p>
        </div>
      )}

      {products.map((product) => (
        <div key={product.id} className="card">
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium text-[var(--foreground)]">
                    {product.product_name}
                  </h4>
                  {product.service_line && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)]">
                      {product.service_line}
                    </span>
                  )}
                </div>
                {product.description && (
                  <p className="text-sm text-[var(--foreground-muted)] mt-1 line-clamp-2">
                    {product.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 ml-4">
                <button
                  onClick={() => startEditProduct(product)}
                  className="p-1.5 text-[var(--foreground-muted)] hover:text-[var(--accent)]"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="p-1.5 text-[var(--foreground-muted)] hover:text-[var(--error)]"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Capabilities toggle */}
            {product.capabilities && product.capabilities.length > 0 && (
              <button
                onClick={() => toggleProductExpand(product.id)}
                className="flex items-center gap-1 mt-3 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              >
                {expandedProducts.has(product.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                Capabilities ({product.capabilities.length})
              </button>
            )}
          </div>

          {/* Expanded capabilities */}
          {expandedProducts.has(product.id) &&
            product.capabilities?.length > 0 && (
              <div className="border-t border-[var(--border)] px-4 py-3 space-y-2">
                {product.capabilities.map((cap, ci) => (
                  <div
                    key={ci}
                    className="p-3 rounded-lg bg-[var(--background-secondary)]"
                  >
                    <p className="font-medium text-sm text-[var(--foreground)]">
                      {cap.name}
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                      {cap.description}
                    </p>
                    {cap.outcomes?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {cap.outcomes.map((o) => (
                          <span
                            key={o}
                            className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)]"
                          >
                            {OUTCOME_OPTIONS.find((opt) => opt.value === o)
                              ?.label || o}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
        </div>
      ))}
    </div>
  );
}
