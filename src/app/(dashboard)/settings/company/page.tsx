"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import {
  Building2,
  Save,
  Loader2,
  Check,
  Plus,
  Trash2,
  Award,
  Target,
  AlertCircle,
  Package,
  ChevronDown,
  ChevronRight,
  Pencil,
  X,
} from "lucide-react";

interface CompanyContext {
  id?: string;
  category: string;
  key: string;
  title: string;
  content: string;
}

interface Organization {
  id: string;
  name: string;
  settings: {
    description?: string;
    differentiators?: string[];
    industries?: string[];
    services?: string[];
  };
}

interface ProductCapability {
  name: string;
  description: string;
  outcomes: string[];
}

interface Product {
  id: string;
  product_name: string;
  service_line: string;
  description: string;
  capabilities: ProductCapability[];
}

const OUTCOME_OPTIONS = [
  { value: "cost_optimization", label: "Cost Optimization" },
  { value: "speed_to_value", label: "Speed to Value" },
  { value: "quality_improvement", label: "Quality Improvement" },
  { value: "risk_reduction", label: "Risk Reduction" },
  { value: "innovation", label: "Innovation" },
  { value: "compliance", label: "Compliance" },
];

export default function CompanySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [org, setOrg] = useState<Organization | null>(null);
  const [contexts, setContexts] = useState<CompanyContext[]>([]);
  const [activeTab, setActiveTab] = useState<
    "profile" | "differentiators" | "certifications" | "products"
  >("profile");

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [differentiators, setDifferentiators] = useState<string[]>([""]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [newCertification, setNewCertification] = useState({
    title: "",
    content: "",
  });

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(
    new Set(),
  );
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    product_name: "",
    service_line: "",
    description: "",
    capabilities: [] as ProductCapability[],
  });
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productSaving, setProductSaving] = useState(false);

  const supabase = createClient();
  const authFetch = useAuthFetch();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (profile?.organization_id) {
        // Load organization
        const { data: organization } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", profile.organization_id)
          .single();

        if (organization) {
          setOrg(organization);
          setCompanyName(organization.name || "");
          setDescription(organization.settings?.description || "");
          setDifferentiators(
            organization.settings?.differentiators?.length > 0
              ? organization.settings.differentiators
              : [""],
          );
          setIndustries(organization.settings?.industries || []);
          setServices(organization.settings?.services || []);
        }

        // Load company contexts
        const { data: contextData } = await supabase
          .from("company_context")
          .select("*")
          .eq("organization_id", profile.organization_id)
          .order("category", { ascending: true });

        if (contextData) {
          setContexts(contextData);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    if (!org) return;
    setSaving(true);
    setSaved(false);

    try {
      // Update organization
      const { error: orgError } = await supabase
        .from("organizations")
        .update({
          name: companyName,
          settings: {
            ...org.settings,
            description,
            differentiators: differentiators.filter((d) => d.trim()),
            industries,
            services,
          },
        })
        .eq("id", org.id);

      if (orgError) throw orgError;

      // Upsert company_context entries for key profile info
      const profileContexts = [
        {
          category: "brand",
          key: "company_name",
          title: "Company Name",
          content: companyName,
        },
        {
          category: "brand",
          key: "description",
          title: "Company Description",
          content: description,
        },
      ];

      for (const ctx of profileContexts) {
        const existing = contexts.find(
          (c) => c.category === ctx.category && c.key === ctx.key,
        );
        if (existing) {
          await supabase
            .from("company_context")
            .update({ title: ctx.title, content: ctx.content })
            .eq("id", existing.id);
        } else if (ctx.content) {
          await supabase.from("company_context").insert({
            ...ctx,
            organization_id: org.id,
          });
        }
      }

      // Save differentiators as company context
      const diffContent = differentiators.filter((d) => d.trim()).join("\n\n");
      if (diffContent) {
        const existingDiff = contexts.find(
          (c) => c.category === "brand" && c.key === "differentiators",
        );
        if (existingDiff) {
          await supabase
            .from("company_context")
            .update({ content: diffContent })
            .eq("id", existingDiff.id);
        } else {
          await supabase.from("company_context").insert({
            category: "brand",
            key: "differentiators",
            title: "Key Differentiators",
            content: diffContent,
            organization_id: org.id,
          });
        }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      await loadData();
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddCertification() {
    if (!org || !newCertification.title || !newCertification.content) return;
    setSaving(true);

    try {
      const key = newCertification.title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_");
      await supabase.from("company_context").insert({
        category: "certifications",
        key,
        title: newCertification.title,
        content: newCertification.content,
        organization_id: org.id,
      });

      setNewCertification({ title: "", content: "" });
      await loadData();
    } catch (error) {
      console.error("Error adding certification:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteContext(id: string) {
    if (!confirm("Are you sure you want to delete this?")) return;

    try {
      await supabase.from("company_context").delete().eq("id", id);
      await loadData();
    } catch (error) {
      console.error("Error deleting:", error);
    }
  }

  // ── Products handlers ──────────────────────────────────────────────────

  const loadProducts = useCallback(async () => {
    try {
      const res = await authFetch("/api/settings/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    }
  }, [authFetch]);

  useEffect(() => {
    if (activeTab === "products" && products.length === 0) {
      loadProducts();
    }
  }, [activeTab, loadProducts, products.length]);

  function resetProductForm() {
    setProductForm({
      product_name: "",
      service_line: "",
      description: "",
      capabilities: [],
    });
    setShowAddProduct(false);
    setEditingProduct(null);
  }

  function startEditProduct(product: Product) {
    setEditingProduct(product.id);
    setProductForm({
      product_name: product.product_name,
      service_line: product.service_line,
      description: product.description,
      capabilities: product.capabilities || [],
    });
    setShowAddProduct(false);
  }

  async function handleSaveProduct() {
    if (!productForm.product_name.trim()) return;
    setProductSaving(true);

    try {
      if (editingProduct) {
        const res = await authFetch("/api/settings/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingProduct, ...productForm }),
        });
        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || "Failed to update product");
          return;
        }
      } else {
        const res = await authFetch("/api/settings/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productForm),
        });
        if (!res.ok) {
          const err = await res.json();
          toast.error(err.error || "Failed to create product");
          return;
        }
      }
      resetProductForm();
      await loadProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product");
    } finally {
      setProductSaving(false);
    }
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await authFetch(`/api/settings/products?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await loadProducts();
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  }

  function toggleProductExpand(id: string) {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addCapability() {
    setProductForm({
      ...productForm,
      capabilities: [
        ...productForm.capabilities,
        { name: "", description: "", outcomes: [] },
      ],
    });
  }

  function updateCapability(index: number, field: string, value: unknown) {
    const updated = [...productForm.capabilities];
    updated[index] = { ...updated[index], [field]: value };
    setProductForm({ ...productForm, capabilities: updated });
  }

  function removeCapability(index: number) {
    setProductForm({
      ...productForm,
      capabilities: productForm.capabilities.filter((_, i) => i !== index),
    });
  }

  function toggleOutcome(capIndex: number, outcome: string) {
    const cap = productForm.capabilities[capIndex];
    const outcomes = cap.outcomes.includes(outcome)
      ? cap.outcomes.filter((o) => o !== outcome)
      : [...cap.outcomes, outcome];
    updateCapability(capIndex, "outcomes", outcomes);
  }

  const addDifferentiator = () => setDifferentiators([...differentiators, ""]);
  const updateDifferentiator = (index: number, value: string) => {
    const updated = [...differentiators];
    updated[index] = value;
    setDifferentiators(updated);
  };
  const removeDifferentiator = (index: number) => {
    if (differentiators.length > 1) {
      setDifferentiators(differentiators.filter((_, i) => i !== index));
    }
  };

  const certifications = contexts.filter(
    (c) => c.category === "certifications",
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Company Profile
        </h1>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Configure your company information to personalize AI-generated
          proposals
        </p>
      </div>

      {/* Info Banner */}
      <div className="card p-4 mb-6 bg-[var(--accent-subtle)] border-[var(--accent)]">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-[var(--accent)] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-[var(--foreground)]">
              <strong>Why this matters:</strong> The AI uses your company
              profile to write proposals that sound like you. Add your unique
              differentiators and certifications to make every proposal
              authentically represent your company.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-[var(--border)]">
        {[
          { id: "profile", label: "Company Profile", icon: Building2 },
          { id: "differentiators", label: "Differentiators", icon: Target },
          { id: "certifications", label: "Certifications", icon: Award },
          { id: "products", label: "Products & Services", icon: Package },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="card p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                placeholder="Your Company Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Company Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent resize-none"
                placeholder="Describe what your company does, your mission, and what makes you unique..."
              />
              <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                This description will be used in the &quot;About Us&quot;
                sections of your proposals.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="btn-primary"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : saved ? (
                  <>
                    <Check className="h-4 w-4" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Differentiators Tab */}
      {activeTab === "differentiators" && (
        <div className="card p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-[var(--foreground)]">
              Key Differentiators
            </h3>
            <p className="text-sm text-[var(--foreground-muted)]">
              What makes your company stand out? These will be highlighted in
              &quot;Why Us&quot; sections.
            </p>
          </div>

          <div className="space-y-3">
            {differentiators.map((diff, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={diff}
                  onChange={(e) => updateDifferentiator(index, e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                  placeholder={`Differentiator ${index + 1} (e.g., "20+ years of industry experience")`}
                />
                {differentiators.length > 1 && (
                  <button
                    onClick={() => removeDifferentiator(index)}
                    className="p-2 text-[var(--foreground-muted)] hover:text-[var(--error)]"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addDifferentiator}
            className="mt-3 flex items-center gap-2 text-sm text-[var(--accent)] hover:underline"
          >
            <Plus className="h-4 w-4" />
            Add another differentiator
          </button>

          <div className="flex justify-end mt-6">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saved ? (
                <>
                  <Check className="h-4 w-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Products & Services Tab */}
      {activeTab === "products" && (
        <div className="space-y-4">
          {/* Header with Add button */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-[var(--foreground)]">
                Products & Services
              </h3>
              <p className="text-sm text-[var(--foreground-muted)]">
                Define your products, service lines, and capabilities for
                AI-generated proposals.
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
                Add your products and capabilities so the AI can reference them
                in proposals.
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
      )}

      {/* Certifications Tab */}
      {activeTab === "certifications" && (
        <div className="space-y-6">
          {/* Existing Certifications */}
          {certifications.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-4">
                Your Certifications & Partnerships
              </h3>
              <div className="space-y-3">
                {certifications.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-start justify-between p-4 rounded-lg bg-[var(--background-secondary)]"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-[var(--accent)]" />
                        <span className="font-medium text-[var(--foreground)]">
                          {cert.title}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                        {cert.content}
                      </p>
                    </div>
                    <button
                      onClick={() => cert.id && handleDeleteContext(cert.id)}
                      className="p-1 text-[var(--foreground-muted)] hover:text-[var(--error)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Certification */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-4">
              Add Certification or Partnership
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Certification Name
                </label>
                <input
                  type="text"
                  value={newCertification.title}
                  onChange={(e) =>
                    setNewCertification({
                      ...newCertification,
                      title: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                  placeholder="e.g., AWS Premier Partner, ISO 27001 Certified"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                  Description
                </label>
                <textarea
                  value={newCertification.content}
                  onChange={(e) =>
                    setNewCertification({
                      ...newCertification,
                      content: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent resize-none"
                  placeholder="Brief description of the certification and what it means for your clients..."
                />
              </div>
              <button
                onClick={handleAddCertification}
                disabled={
                  saving || !newCertification.title || !newCertification.content
                }
                className="btn-primary"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add Certification
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
