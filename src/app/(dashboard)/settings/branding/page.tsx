"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  Palette,
  Save,
  Loader2,
  Check,
  Upload,
  Image as ImageIcon,
  Type,
  X,
  Eye,
} from "lucide-react";
import { logger } from "@/lib/utils/logger";

interface BrandingSettings {
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  header_text?: string;
  footer_text?: string;
}

const DEFAULT_BRANDING: BrandingSettings = {
  primary_color: "#0070AD",
  secondary_color: "#1B365D",
  accent_color: "#12ABDB",
  font_family: "Arial",
};

const FONT_OPTIONS = [
  "Arial",
  "Helvetica",
  "Georgia",
  "Times New Roman",
  "Calibri",
  "Verdana",
  "Trebuchet MS",
  "Century Gothic",
];

export default function BrandingSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING);
  const [orgName, setOrgName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  useEffect(() => {
    loadBranding();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, []);

  async function loadBranding() {
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
        setOrgId(profile.organization_id);

        const { data: org } = await supabase
          .from("organizations")
          .select("name, settings")
          .eq("id", profile.organization_id)
          .single();

        if (org) {
          setOrgName(org.name || "");
          if (org.settings?.branding) {
            setBranding({ ...DEFAULT_BRANDING, ...org.settings.branding });
          }
        }
      }
    } catch (error) {
      logger.error("Error loading branding", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!orgId) return;
    setSaving(true);
    setSaved(false);

    try {
      const { data: org } = await supabase
        .from("organizations")
        .select("settings")
        .eq("id", orgId)
        .single();

      await supabase
        .from("organizations")
        .update({
          settings: {
            ...org?.settings,
            branding,
          },
        })
        .eq("id", orgId);

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      logger.error("Error saving branding", error);
      toast.error("Failed to save branding settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !orgId) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be less than 2MB");
      return;
    }

    setUploading(true);

    try {
      const fileName = `${orgId}/logo-${Date.now()}.${file.name.split(".").pop()}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("organization-assets")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("organization-assets")
        .getPublicUrl(fileName);

      setBranding({ ...branding, logo_url: urlData.publicUrl });
    } catch (error) {
      logger.error("Error uploading logo", error);
      toast.error(
        "Failed to upload logo. Make sure the organization-assets bucket exists in Supabase Storage.",
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function removeLogo() {
    setBranding({ ...branding, logo_url: undefined });
  }

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
          Branding
        </h1>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Customize how your proposals look when exported
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Logo Section */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-subtle)]">
              <ImageIcon className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="font-semibold text-[var(--foreground)]">
                Company Logo
              </h2>
              <p className="text-sm text-[var(--foreground-muted)]">
                Appears on cover pages and headers
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {branding.logo_url ? (
              <div className="relative">
                <div className="relative flex items-center justify-center p-6 rounded-lg bg-[var(--background-secondary)] border border-[var(--border)] min-h-[80px]">
                  <Image
                    src={branding.logo_url}
                    alt="Company logo"
                    fill
                    className="object-contain p-4"
                    unoptimized
                  />
                </div>
                <button
                  onClick={removeLogo}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-[var(--error)] text-white hover:opacity-90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--background-secondary)] cursor-pointer hover:border-[var(--accent)] transition-colors"
              >
                {uploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-[var(--foreground-muted)] mb-2" />
                    <span className="text-sm text-[var(--foreground-muted)]">
                      Click to upload logo
                    </span>
                    <span className="text-xs text-[var(--foreground-subtle)] mt-1">
                      PNG, JPG, SVG (max 2MB)
                    </span>
                  </>
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Colors Section */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-subtle)]">
              <Palette className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="font-semibold text-[var(--foreground)]">
                Brand Colors
              </h2>
              <p className="text-sm text-[var(--foreground-muted)]">
                Used in headers, accents, and highlights
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Primary Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={branding.primary_color}
                  onChange={(e) =>
                    setBranding({ ...branding, primary_color: e.target.value })
                  }
                  className="h-10 w-14 rounded cursor-pointer border border-[var(--border)]"
                />
                <input
                  type="text"
                  value={branding.primary_color}
                  onChange={(e) =>
                    setBranding({ ...branding, primary_color: e.target.value })
                  }
                  className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Secondary Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={branding.secondary_color}
                  onChange={(e) =>
                    setBranding({
                      ...branding,
                      secondary_color: e.target.value,
                    })
                  }
                  className="h-10 w-14 rounded cursor-pointer border border-[var(--border)]"
                />
                <input
                  type="text"
                  value={branding.secondary_color}
                  onChange={(e) =>
                    setBranding({
                      ...branding,
                      secondary_color: e.target.value,
                    })
                  }
                  className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Accent Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={branding.accent_color}
                  onChange={(e) =>
                    setBranding({ ...branding, accent_color: e.target.value })
                  }
                  className="h-10 w-14 rounded cursor-pointer border border-[var(--border)]"
                />
                <input
                  type="text"
                  value={branding.accent_color}
                  onChange={(e) =>
                    setBranding({ ...branding, accent_color: e.target.value })
                  }
                  className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Typography Section */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-subtle)]">
              <Type className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="font-semibold text-[var(--foreground)]">
                Typography
              </h2>
              <p className="text-sm text-[var(--foreground-muted)]">
                Font used in exported documents
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Font Family
            </label>
            <select
              value={branding.font_family}
              onChange={(e) =>
                setBranding({ ...branding, font_family: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </option>
              ))}
            </select>
            <p
              className="mt-3 text-lg text-[var(--foreground)]"
              style={{ fontFamily: branding.font_family }}
            >
              The quick brown fox jumps over the lazy dog
            </p>
          </div>
        </div>

        {/* Header/Footer Section */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-subtle)]">
              <Eye className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="font-semibold text-[var(--foreground)]">
                Document Text
              </h2>
              <p className="text-sm text-[var(--foreground-muted)]">
                Custom header and footer text
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Header Text (optional)
              </label>
              <input
                type="text"
                value={branding.header_text || ""}
                onChange={(e) =>
                  setBranding({ ...branding, header_text: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                placeholder={orgName || "Your Company Name"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Footer Text (optional)
              </label>
              <input
                type="text"
                value={branding.footer_text || ""}
                onChange={(e) =>
                  setBranding({ ...branding, footer_text: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                placeholder="Confidential - For Client Use Only"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Color Preview */}
      <div className="card p-6 mt-6">
        <h3 className="font-semibold text-[var(--foreground)] mb-4">Preview</h3>
        <div className="rounded-lg overflow-hidden border border-[var(--border)]">
          <div
            className="p-4"
            style={{ backgroundColor: branding.secondary_color }}
          >
            <div className="flex items-center gap-4">
              {branding.logo_url && (
                <div className="relative h-8 w-24 flex-shrink-0">
                  <Image
                    src={branding.logo_url}
                    alt="Logo"
                    fill
                    className="object-contain"
                    style={{ filter: "brightness(0) invert(1)" }}
                    unoptimized
                  />
                </div>
              )}
              <div>
                <h4
                  className="text-lg font-bold text-white"
                  style={{ fontFamily: branding.font_family }}
                >
                  Sample Proposal Title
                </h4>
                <p className="text-sm text-white/70">
                  Prepared for Client Name
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-white">
            <div
              className="h-2 rounded mb-3"
              style={{ backgroundColor: branding.primary_color, width: "40%" }}
            />
            <div
              className="text-lg font-semibold mb-2"
              style={{
                color: branding.primary_color,
                fontFamily: branding.font_family,
              }}
            >
              Section Heading
            </div>
            <p
              className="text-gray-600 text-sm"
              style={{ fontFamily: branding.font_family }}
            >
              This is how your proposal content will appear with your branding
              applied. Colors and fonts will be used consistently throughout.
            </p>
            <div
              className="inline-block mt-3 px-4 py-2 rounded text-white text-sm font-medium"
              style={{ backgroundColor: branding.accent_color }}
            >
              Call to Action
            </div>
          </div>
          {branding.footer_text && (
            <div
              className="px-4 py-2 text-xs text-white/60 text-center"
              style={{ backgroundColor: branding.secondary_color }}
            >
              {branding.footer_text}
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end mt-6">
        <button onClick={handleSave} disabled={saving} className="btn-primary">
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
              Save Branding
            </>
          )}
        </button>
      </div>
    </div>
  );
}
