"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import {
  Building2,
  Loader2,
  Target,
  AlertCircle,
  Package,
  Award,
} from "lucide-react";

import {
  CompanyContext,
  Organization,
  Product,
  ProductCapability,
} from "./_components/types";
import { ProfileTab } from "./_components/profile-tab";
import { DifferentiatorsTab } from "./_components/differentiators-tab";
import { ProductsTab } from "./_components/products-tab";
import { CertificationsTab } from "./_components/certifications-tab";
import { DeleteConfirmModal } from "./_components/delete-confirm-modal";

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
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    type: "context" | "product";
  } | null>(null);

  const supabase = createClient();
  const authFetch = useAuthFetch();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
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
    if (!deleteConfirm || deleteConfirm.id !== id) {
      setDeleteConfirm({ id, type: "context" });
      return;
    }
    setDeleteConfirm(null);

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
    if (!deleteConfirm || deleteConfirm.id !== id) {
      setDeleteConfirm({ id, type: "product" });
      return;
    }
    setDeleteConfirm(null);

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
        <ProfileTab
          companyName={companyName}
          setCompanyName={setCompanyName}
          description={description}
          setDescription={setDescription}
          saving={saving}
          saved={saved}
          onSave={handleSaveProfile}
        />
      )}

      {/* Differentiators Tab */}
      {activeTab === "differentiators" && (
        <DifferentiatorsTab
          differentiators={differentiators}
          addDifferentiator={addDifferentiator}
          updateDifferentiator={updateDifferentiator}
          removeDifferentiator={removeDifferentiator}
          saving={saving}
          saved={saved}
          onSave={handleSaveProfile}
        />
      )}

      {/* Products & Services Tab */}
      {activeTab === "products" && (
        <ProductsTab
          products={products}
          expandedProducts={expandedProducts}
          editingProduct={editingProduct}
          productForm={productForm}
          showAddProduct={showAddProduct}
          productSaving={productSaving}
          services={services}
          resetProductForm={resetProductForm}
          setShowAddProduct={setShowAddProduct}
          setProductForm={setProductForm}
          startEditProduct={startEditProduct}
          handleSaveProduct={handleSaveProduct}
          handleDeleteProduct={handleDeleteProduct}
          toggleProductExpand={toggleProductExpand}
          addCapability={addCapability}
          updateCapability={updateCapability}
          removeCapability={removeCapability}
          toggleOutcome={toggleOutcome}
        />
      )}

      {/* Certifications Tab */}
      {activeTab === "certifications" && (
        <CertificationsTab
          certifications={certifications}
          newCertification={newCertification}
          setNewCertification={setNewCertification}
          handleAddCertification={handleAddCertification}
          handleDeleteContext={handleDeleteContext}
          deleteConfirm={deleteConfirm}
          setDeleteConfirm={setDeleteConfirm}
          saving={saving}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <DeleteConfirmModal
          deleteConfirm={deleteConfirm}
          setDeleteConfirm={setDeleteConfirm}
          onDeleteProduct={handleDeleteProduct}
          onDeleteContext={handleDeleteContext}
        />
      )}
    </div>
  );
}
