import { useRef, useState } from 'react'
import { addOnCategories } from '../../data/addOns.js'
import {
  premiumFlooringOptions,
  standardFlooringOptions,
  vinylFlooringOptions,
} from '../../data/flooring.js'
import { getPublicAssetUrl } from '../utils/publicAssetPath.js'
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
            <img src={getPublicAssetUrl(booth.thumbnailPath)} alt="" />
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

function PanelSubsection({ title, children }) {
  return (
    <div className="panel-subsection">
      <h2>{title}</h2>
      {children}
    </div>
  )
}

function getAccessoryDetail(accessory, settings = {}) {
  return (accessory.summaryFields ?? [])
    .flatMap((field) => {
      const value = settings[field.setting] ?? accessory[field.defaultProperty]
      return value === undefined || value === null || value === ''
        ? []
        : [`${value}${field.suffix ?? ''}`]
    })
    .join(', ')
}

function AddOnCards({
  addOns,
  accessories,
  selectedAccessoryId,
  onAdd,
  onRemove,
}) {
  return addOnCategories.map((category) => {
    const categoryAddOns = addOns.filter((addOn) => addOn.category === category)

    return (
      <PanelSubsection key={category} title={category}>
        {categoryAddOns.length ? (
          <div className="layout-card-list">
            {categoryAddOns.map((addOn) => {
              const instances = accessories.filter(
                (accessory) => accessory.addOnId === addOn.id,
              )
              const isSelected = instances.some(
                (accessory) => accessory.id === selectedAccessoryId,
              )
              const removeTarget =
                instances.find((accessory) => accessory.id === selectedAccessoryId) ??
                instances.at(-1)

              return (
                <div
                  key={addOn.id}
                  className={`layout-card add-on-card ${isSelected ? 'is-selected' : ''}`}
                >
                  <div className="add-on-card-main">
                    <span className="layout-thumb" aria-hidden="true">
                      <img src={getPublicAssetUrl(addOn.thumbnailPath)} alt="" />
                    </span>
                    <span className="layout-copy">
                      <span className="layout-code">{addOn.name}</span>
                    </span>
                  </div>
                  <div className="add-on-actions">
                    <button
                      type="button"
                      className="add-on-action"
                      aria-label={`Add ${addOn.name}`}
                      onClick={() => onAdd(addOn.id)}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="add-on-action"
                      aria-label={`Remove ${addOn.name}`}
                      disabled={!removeTarget}
                      onClick={() => removeTarget && onRemove(removeTarget.id)}
                    >
                      -
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="panel-note">No add-ons available yet.</p>
        )}
      </PanelSubsection>
    )
  })
}

function AddOnOptions({ addOn, accessory, settings, onSettingChange }) {
  if (!addOn || !accessory) {
    return null
  }

  return (
    <div className="add-on-options">
      <p className="field-label">Selected: {accessory.name}</p>
      {Number.isInteger(addOn.defaultQuantity) && (
        <label className="add-on-option-control">
          <span>Shelf quantity: {settings.quantity ?? addOn.defaultQuantity}</span>
          <input
            type="range"
            min={addOn.minQuantity}
            max={addOn.maxQuantity}
            step="1"
            value={settings.quantity ?? addOn.defaultQuantity}
            onChange={(event) =>
              onSettingChange(accessory.id, 'quantity', Number(event.target.value))
            }
          />
        </label>
      )}
      {addOn.defaultSize && (
        <label className="add-on-option-control">
          <span>TV size</span>
          <select
            value={settings.size ?? addOn.defaultSize}
            onChange={(event) =>
              onSettingChange(accessory.id, 'size', Number(event.target.value))
            }
          >
            {addOn.sizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}in
              </option>
            ))}
          </select>
        </label>
      )}
      {addOn.defaultColor && (
        <label className="add-on-option-control">
          <span>{addOn.colorSettingLabel ?? 'Color'}</span>
          <select
            value={settings.color ?? addOn.defaultColor}
            onChange={(event) =>
              onSettingChange(accessory.id, 'color', event.target.value)
            }
          >
            {addOn.colorOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <p className="panel-note">Select the add-on in the preview to move or rotate it.</p>
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
              style={{ backgroundImage: `url(${getPublicAssetUrl(option.texturePath)})` }}
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
  onHighlightChange,
}) {
  const inputId = `graphic-upload-${zone.id}`
  const displayLabel = zone.label.replace(/\s+Graphic$/i, '')
  const zoneRef = useRef(null)

  const clearHighlightUnlessActive = (event) => {
    const zoneElement = zoneRef.current

    if (
      zoneElement?.matches(':hover') ||
      (event.relatedTarget && zoneElement?.contains(event.relatedTarget))
    ) {
      return
    }

    onHighlightChange(null)
  }

  return (
    <div
      ref={zoneRef}
      className="graphic-upload-zone"
      tabIndex="0"
      onMouseEnter={() => onHighlightChange(zone.id)}
      onMouseLeave={clearHighlightUnlessActive}
      onFocus={() => onHighlightChange(zone.id)}
      onBlur={clearHighlightUnlessActive}
    >
      <div className="graphic-upload-heading">
        <h2>{displayLabel}</h2>
        <p>
          Size: {zone.recommendedWidth} × {zone.recommendedHeight} px
        </p>
        <p>JPG or PNG, max 4 MB per file</p>
      </div>

      <input
        id={inputId}
        className="visually-hidden"
        type="file"
        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
        onChange={(event) => {
          onGraphicFileChange(zone.id, event.target.files?.[0])
          event.target.value = ''
        }}
      />
      <label className="upload-button" htmlFor={inputId}>
        Upload
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
      ) : null}

      {error && <p className="graphic-error">{error}</p>}
    </div>
  )
}

export default function RightPanel({
  boothSizes,
  booths,
  selectedSize,
  selectedBooth,
  accessories,
  addOns,
  selectedAccessoryId,
  addOnSettings,
  addOnLimitMessage,
  selectedFlooringId,
  graphicZones,
  graphicUploads,
  graphicErrors,
  onSizeChange,
  onBoothChange,
  onAddOnAdd,
  onAddOnRemove,
  onAddOnSelect,
  onAddOnSettingChange,
  onFlooringChange,
  onGraphicFileChange,
  onGraphicClear,
  onGraphicHighlightChange,
  onExportPdf,
  onResetBooth,
  isExportingPdf,
  exportStatus,
}) {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)
  const [openSectionId, setOpenSectionId] = useState('help')
  const selectedAccessory = accessories.find(
    (accessory) => accessory.id === selectedAccessoryId,
  )
  const selectedAddOn = addOns.find(
    (addOn) => addOn.id === selectedAccessory?.addOnId,
  )
  const visibleOpenSectionId = selectedAddOn ? 'add-ons' : openSectionId
  const addAddOn = (addOnId) => {
    setOpenSectionId('add-ons')
    onAddOnAdd(addOnId)
  }
  const selectBooth = (boothId) => {
    onBoothChange(boothId)

    if (window.matchMedia('(max-width: 767px)').matches) {
      setIsMobileDrawerOpen(false)
    }
  }
  const toggleSection = (sectionId) => {
    if (selectedAddOn) {
      onAddOnSelect(null)
      setOpenSectionId(sectionId === 'add-ons' ? null : sectionId)
      return
    }

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
            id="help"
            title="Help / How to Use"
            openSectionId={visibleOpenSectionId}
            onOpen={toggleSection}
          >
            <ul className="how-to-list">
              <li>
                Select a booth layout under Booth Selection. Standard options are
                available in 10x10 and 10x20 layouts. Contact us to customize an
                exhibit based on your size and needs.
              </li>
              <li>Replace the default booth graphics under the Graphics section.</li>
              <li>
                Each booth includes default options. Add more furniture and
                accessories under Add-Ons.
              </li>
              <li>Change the carpet type and color under Carpet &amp; Flooring.</li>
              <li>
                Export your booth layout as a PDF with booth details under the Export
                section.
              </li>
              <li>
                To move around the scene, left click and drag to orbit. On mobile, use
                one finger to orbit.
              </li>
              <li>
                Zoom in and out with the mouse scroll wheel. On mobile, pinch to zoom.
              </li>
              <li>
                To move furniture or an accessory, select the add-on, then use the
                arrows to move it or the rotation circle to rotate it.
              </li>
            </ul>
          </Section>

          <Section
            id="booth-selection"
            title="Booth Selection"
            openSectionId={visibleOpenSectionId}
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
              onBoothChange={selectBooth}
            />
          </Section>

          <Section
            id="booth-details"
            title="Booth Details"
            openSectionId={visibleOpenSectionId}
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
                {accessories.map((accessory) => (
                  <li key={accessory.id}>
                    {accessory.name}
                    {getAccessoryDetail(
                      accessory,
                      addOnSettings[accessory.id],
                    ) &&
                      ` — ${getAccessoryDetail(
                        accessory,
                        addOnSettings[accessory.id],
                      )}`}
                  </li>
                ))}
              </ul>
            </div>
          </Section>

          <Section
            id="graphics"
            title="Graphics"
            openSectionId={visibleOpenSectionId}
            onOpen={toggleSection}
          >
            <p className="panel-note">
              Upload JPG or PNG previews for the booth graphics. Images are used only in this
              browser preview and are not stored.
            </p>
            <div className="graphic-upload-grid">
              {graphicZones.map((zone) => (
                <GraphicUploadZone
                  key={zone.id}
                  zone={zone}
                  upload={graphicUploads[zone.id]}
                  error={graphicErrors[zone.id]}
                  onGraphicFileChange={onGraphicFileChange}
                  onGraphicClear={onGraphicClear}
                  onHighlightChange={onGraphicHighlightChange}
                />
              ))}
            </div>
          </Section>

          <Section
            id="add-ons"
            title="Add-Ons"
            openSectionId={visibleOpenSectionId}
            onOpen={toggleSection}
          >
            {addOnLimitMessage && (
              <p className="add-on-limit-message" role="status">
                {addOnLimitMessage}
              </p>
            )}
            <AddOnOptions
              addOn={selectedAddOn}
              accessory={selectedAccessory}
              settings={addOnSettings[selectedAccessory?.id] ?? {}}
              onSettingChange={onAddOnSettingChange}
            />
            <AddOnCards
              addOns={addOns}
              accessories={accessories}
              selectedAccessoryId={selectedAccessoryId}
              onAdd={addAddOn}
              onRemove={onAddOnRemove}
            />
          </Section>

          <Section
            id="carpet-flooring"
            title="Carpet & Flooring"
            openSectionId={visibleOpenSectionId}
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

            <PanelSubsection title="Premium Carpet">
              <TextureSwatches
                label="Premium Carpet"
                value={selectedFlooringId}
                options={premiumFlooringOptions}
                showLabel={false}
                onChange={onFlooringChange}
              />
            </PanelSubsection>

            <PanelSubsection title="Vinyl Flooring">
              <TextureSwatches
                label="Vinyl Flooring"
                value={selectedFlooringId}
                options={vinylFlooringOptions}
                showLabel={false}
                onChange={onFlooringChange}
              />
            </PanelSubsection>
          </Section>

          <Section
            id="export"
            title="Export"
            openSectionId={visibleOpenSectionId}
            onOpen={toggleSection}
          >
            <p className="panel-note">
              Export a first-pass booth summary PDF with perspective, front, and top
              preview images plus the current booth details.
            </p>
            <button
              type="button"
              className="primary-button export-button"
              disabled={isExportingPdf}
              onClick={onExportPdf}
            >
              {isExportingPdf ? 'Exporting PDF...' : 'Export PDF summary'}
            </button>
            {exportStatus && <p className="export-status">{exportStatus}</p>}
          </Section>

          <Section
            id="contact-sourceone"
            title="Contact SourceOne Events"
            openSectionId={visibleOpenSectionId}
            onOpen={toggleSection}
          >
            <p className="panel-note contact-note">
              Export your layout as a PDF and email it to:{' '}
              <a href="mailto:exhibitorservices@sourceoneevents.com">
                exhibitorservices@sourceoneevents.com
              </a>
            </p>
          </Section>
        </div>

        <footer className="panel-footer">
          <p>Your layout is temporary and will reset if you reload the page.</p>
          <button type="button" className="reset-button" onClick={onResetBooth}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Reset Booth
          </button>
          <p>© 2026 SourceOne Events. All rights reserved.</p>
        </footer>
      </aside>
    </>
  )
}
