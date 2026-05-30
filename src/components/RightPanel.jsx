import { useState } from 'react'

function Section({ title, defaultOpen = false, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section className="panel-section">
      <button
        type="button"
        className="section-toggle"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{title}</span>
        <span aria-hidden="true">{isOpen ? '-' : '+'}</span>
      </button>
      <div className={`section-body ${isOpen ? 'is-open' : ''}`}>
        <div className="section-inner">{children}</div>
      </div>
    </section>
  )
}

function SegmentedControl({ label, value, options, onChange }) {
  return (
    <div className="field-group">
      <p className="field-label">{label}</p>
      <div className="segmented-control">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={value === option.value ? 'is-active' : ''}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function LayoutCards({ booths, selectedBooth, onBoothChange }) {
  return (
    <div className="layout-card-list">
      {booths.map((booth) => (
        <button
          key={booth.id}
          type="button"
          className={`layout-card ${selectedBooth.id === booth.id ? 'is-selected' : ''}`}
          onClick={() => onBoothChange(booth.id)}
        >
          <span
            className="layout-thumb"
            style={{ '--preview-accent': booth.preview?.accent }}
            aria-hidden="true"
          >
            <span className={`preview-wall preview-${booth.preview?.walls}`} />
          </span>
          <span className="layout-copy">
            <span className="layout-code">{booth.code}</span>
            <span className="layout-name">{booth.name}</span>
          </span>
        </button>
      ))}
    </div>
  )
}

function PlaceholderButton({ children }) {
  return (
    <button type="button" className="placeholder-button" disabled>
      {children}
    </button>
  )
}

export default function RightPanel({
  boothSizes,
  booths,
  selectedSize,
  selectedBooth,
  onSizeChange,
  onBoothChange,
  onOpenWelcome,
}) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)

  return (
    <>
      {!isMobileDrawerOpen && (
        <div className="mobile-topbar">
          <div className="mobile-brand">
            <span className="brand-mark">S1</span>
            <span>Build an Exhibit</span>
          </div>
          <button
            type="button"
            className="primary-button"
            onClick={() => setIsMobileDrawerOpen(true)}
          >
            Configure
          </button>
        </div>
      )}

      <aside className={`right-panel ${isMobileDrawerOpen ? 'is-open' : ''}`}>
        <div className="panel-header">
          <div className="panel-brand">
            <span className="brand-mark">S1</span>
            <span>SourceOne Events</span>
          </div>
          <button
            type="button"
            className="close-button"
            onClick={() => setIsMobileDrawerOpen(false)}
          >
            Close
          </button>
        </div>

        <div className="panel-title-block">
          <p className="eyebrow">Build an Exhibit</p>
          <h1>Rental Exhibit Configurator</h1>
          <p>{selectedBooth.name}</p>
        </div>

        <div className="panel-sections">
          <Section title="Booth Selection" defaultOpen>
            <SegmentedControl
              label="Booth size"
              value={selectedSize}
              options={boothSizes}
              onChange={onSizeChange}
            />
            <LayoutCards
              booths={booths}
              selectedBooth={selectedBooth}
              onBoothChange={onBoothChange}
            />
            <button type="button" className="text-button" onClick={onOpenWelcome}>
              Restart selection flow
            </button>
          </Section>

          <Section title="Booth Details" defaultOpen>
            <dl className="details-list">
              <div>
                <dt>Code</dt>
                <dd>{selectedBooth.code}</dd>
              </div>
              <div>
                <dt>Size</dt>
                <dd>{selectedBooth.size}</dd>
              </div>
              <div>
                <dt>Type</dt>
                <dd>{selectedBooth.type}</dd>
              </div>
              <div>
                <dt>Template</dt>
                <dd>
                  {selectedBooth.recommendedTemplateWidth} x{' '}
                  {selectedBooth.recommendedTemplateHeight}px
                </dd>
              </div>
            </dl>
            <p className="panel-note">{selectedBooth.description}</p>
          </Section>

          <Section title="Graphics">
            <p className="panel-note">
              JPG graphic preview upload and downloadable UV/template files will live here.
            </p>
            <PlaceholderButton>Upload graphic preview</PlaceholderButton>
            <PlaceholderButton>Download template</PlaceholderButton>
          </Section>

          <Section title="Furniture">
            <p className="panel-note">
              Furniture placement, rotation, and delete controls will be added in a later phase.
            </p>
            <PlaceholderButton>Add furniture</PlaceholderButton>
          </Section>

          <Section title="Export">
            <p className="panel-note">
              A clean JPG preview export will be wired up after the scene and models are final.
            </p>
            <PlaceholderButton>Export JPG preview</PlaceholderButton>
          </Section>

          <Section title="Contact SourceOne">
            <p className="panel-note">
              Follow-up request submission will be connected after the MVP configurator flow is
              defined.
            </p>
            <PlaceholderButton>Request follow-up</PlaceholderButton>
          </Section>
        </div>

        <footer className="panel-footer">© 2026 SourceOne Events. All rights reserved.</footer>
      </aside>
    </>
  )
}
