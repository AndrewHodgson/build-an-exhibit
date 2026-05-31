import { useState } from 'react'
import {
  premiumFlooringOptions,
  standardFlooringOptions,
} from '../../data/flooring.js'
import SourceOneLogo from './SourceOneLogo.jsx'

function Section({ id, title, openSectionId, onOpen, children }) {
  const isOpen = openSectionId === id
  return (
    <section className="panel-section">
      <button
        type="button"
        className="section-toggle"
        aria-expanded={isOpen}
        onClick={() => onOpen(id)}
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
          <span className="layout-thumb" aria-hidden="true">
            <img src={booth.thumbnailPath} alt="" />
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

function PanelSubsection({ title, children }) {
  return (
    <div className="panel-subsection">
      <h2>{title}</h2>
      {children}
    </div>
  )
}

function TextureSwatches({ label, value, options, onChange, showLabel = true }) {
  return (
    <div className="texture-swatch-group">
      {showLabel && <p className="texture-swatch-label">{label}</p>}
      <div className="texture-swatch-grid">
        {options.map((option) => {
          const isSelected = value === option.id

          return (
            <button
              key={option.id}
              type="button"
              title={option.label}
              aria-label={`${label}: ${option.label}`}
              className={`texture-swatch ${isSelected ? 'is-selected' : ''}`}
              style={{ backgroundImage: `url(${option.texturePath})` }}
              onClick={() => onChange(option.id)}
            />
          )
        })}
      </div>
      <p className="texture-swatch-current">
        {options.find((option) => option.id === value)?.label}
      </p>
    </div>
  )
}

function GraphicUploadZone({
  zone,
  upload,
  error,
  onGraphicFileChange,
  onGraphicClear,
}) {
  const inputId = `graphic-upload-${zone.id}`

  return (
    <div className="graphic-upload-zone">
      <div className="graphic-upload-heading">
        <h2>{zone.label}</h2>
        <p>
          Recommended: {zone.recommendedWidth} × {zone.recommendedHeight} px
        </p>
        <p>JPG only, max 2MB</p>
      </div>

      <input
        id={inputId}
        className="visually-hidden"
        type="file"
        accept=".jpg,.jpeg,image/jpeg"
        onChange={(event) => {
          onGraphicFileChange(zone.id, event.target.files?.[0])
          event.target.value = ''
        }}
      />
      <label className="upload-button" htmlFor={inputId}>
        Upload JPG
      </label>

      {upload ? (
        <div className="graphic-upload-status">
          <p>{upload.fileName}</p>
          <p>
            {upload.wasCropped ? 'Cropped preview' : 'Uploaded preview'} ·{' '}
            {upload.width} x {upload.height}px
          </p>
          {upload.warning && <p className="graphic-warning">{upload.warning}</p>}
          <button
            type="button"
            className="text-button"
            onClick={() => onGraphicClear(zone.id)}
          >
            Clear graphic
          </button>
        </div>
      ) : (
        <p className="graphic-upload-empty">No graphic uploaded.</p>
      )}

      {error && <p className="graphic-error">{error}</p>}
    </div>
  )
}

export default function RightPanel({
  boothSizes,
  booths,
  selectedSize,
  selectedBooth,
  selectedFlooringId,
  graphicZones,
  graphicUploads,
  graphicErrors,
  onSizeChange,
  onBoothChange,
  onFlooringChange,
  onGraphicFileChange,
  onGraphicClear,
}) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)
  const [openSectionId, setOpenSectionId] = useState('booth-selection')
  const toggleSection = (sectionId) => {
    setOpenSectionId((currentSectionId) =>
      currentSectionId === sectionId ? null : sectionId,
    )
  }

  return (
    <>
      {!isMobileDrawerOpen && (
        <div className="mobile-topbar">
          <div className="mobile-brand">
            <SourceOneLogo className="mobile-logo" />
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
            <SourceOneLogo />
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
          <Section
            id="booth-selection"
            title="Booth Selection"
            openSectionId={openSectionId}
            onOpen={toggleSection}
          >
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
          </Section>

          <Section
            id="booth-details"
            title="Booth Details"
            openSectionId={openSectionId}
            onOpen={toggleSection}
          >
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
            </dl>
            <p className="panel-note">{selectedBooth.description}</p>
            <div className="included-block">
              <p className="field-label">Included with this booth</p>
              <ul className="included-list">
                <li>BeMatrix wall structure</li>
                {selectedBooth.includedAccessories?.map((accessory) => (
                  <li key={accessory.id}>{accessory.name}</li>
                ))}
              </ul>
            </div>
          </Section>

          <Section
            id="graphics"
            title="Graphics"
            openSectionId={openSectionId}
            onOpen={toggleSection}
          >
            <p className="panel-note">
              Upload JPG previews for the booth graphics. Images are used only in this
              browser preview and are not stored.
            </p>
            {graphicZones.map((zone) => (
              <GraphicUploadZone
                key={zone.id}
                zone={zone}
                upload={graphicUploads[zone.id]}
                error={graphicErrors[zone.id]}
                onGraphicFileChange={onGraphicFileChange}
                onGraphicClear={onGraphicClear}
              />
            ))}
          </Section>

          <Section
            id="furniture"
            title="Furniture"
            openSectionId={openSectionId}
            onOpen={toggleSection}
          >
            <p className="panel-note">
              Furniture placement, rotation, and delete controls will be added in a later phase.
            </p>
            <PlaceholderButton>Add furniture</PlaceholderButton>
          </Section>

          <Section
            id="carpet-flooring"
            title="Carpet & Flooring"
            openSectionId={openSectionId}
            onOpen={toggleSection}
          >
            <PanelSubsection title="Standard Carpet">
              <TextureSwatches
                label="Standard Carpet"
                value={selectedFlooringId}
                options={standardFlooringOptions}
                showLabel={false}
                onChange={onFlooringChange}
              />
            </PanelSubsection>

            <PanelSubsection title="Premium Carpet & Flooring">
              <TextureSwatches
                label="Premium Carpet & Flooring"
                value={selectedFlooringId}
                options={premiumFlooringOptions}
                showLabel={false}
                onChange={onFlooringChange}
              />
            </PanelSubsection>
          </Section>

          <Section
            id="export"
            title="Export"
            openSectionId={openSectionId}
            onOpen={toggleSection}
          >
            <p className="panel-note">
              A clean JPG preview export will be wired up after the scene and models are final.
            </p>
            <PlaceholderButton>Export JPG preview</PlaceholderButton>
          </Section>

          <Section
            id="contact-sourceone"
            title="Contact SourceOne"
            openSectionId={openSectionId}
            onOpen={toggleSection}
          >
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
