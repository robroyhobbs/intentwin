"use client";

interface Layer {
  name: string;
  desc: string;
}

interface FrameworkSectionProps {
  layers: Layer[];
  activeLayer: number | null;
  setActiveLayer: (layer: number | null) => void;
}

export function FrameworkSection({
  layers,
  activeLayer,
  setActiveLayer,
}: FrameworkSectionProps) {
  return (
    <section id="framework" className="vf-framework">
      <div className="vf-section-inner">
        <span className="vf-label">The Intent Framework</span>
        <h2 className="vf-section-heading">
          Six layers between your draft
          <br />
          and a winning proposal.
        </h2>
        <div className="vf-layers">
          {layers.map((layer, i) => (
            <div
              key={i}
              className={`vf-layer ${activeLayer === i ? "vf-layer-active" : ""}`}
              onMouseEnter={() => setActiveLayer(i)}
              onMouseLeave={() => setActiveLayer(null)}
            >
              <span className="vf-layer-num">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="vf-layer-content">
                <h3 className="vf-layer-name">{layer.name}</h3>
                <p className="vf-layer-desc">{layer.desc}</p>
              </div>
              <div className="vf-layer-bar" />
            </div>
          ))}
        </div>
        <p className="vf-framework-note">
          Not a generic AI writer. A structured methodology trained on how deals
          are actually won.
        </p>
      </div>
    </section>
  );
}
