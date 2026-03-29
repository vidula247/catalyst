'use client';

import { forwardRef, type Ref } from 'react';

/**
 * Generic rendering component for dynamically-registered BigCommerce
 * Widget Template components.
 *
 * Every prop whose key starts with `field_` is a value supplied by a
 * Makeswift control that was generated from the widget template's
 * UI-schema fields.  The component renders them in a simple layout;
 * consumers can customise the markup once their widgets are stable.
 */

interface Props {
  className?: string;
  templateName: string;
}

function renderFieldValue(key: string, value: unknown) {
  if (value == null || value === '') {
    return null;
  }

  if (typeof value === 'string' && /^(https?:)?\/\/.+\.(png|jpe?g|gif|svg|webp)/i.test(value)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={key} key={key} src={value} />;
  }

  if (typeof value === 'object' && 'swatchId' in (value as Record<string, unknown>)) {
    const color = value as { alpha: number; swatchId: string };

    return (
      <div
        key={key}
        style={{
          backgroundColor: `var(--swatch-${color.swatchId}, #888)`,
          width: 24,
          height: 24,
          borderRadius: 4,
          display: 'inline-block',
        }}
      />
    );
  }

  return (
    <span key={key}>
      {String(value)}
    </span>
  );
}

export const DynamicWidget = forwardRef(function DynamicWidget(
  props: Props,
  ref: Ref<HTMLDivElement>,
) {
  const { className, templateName } = props;
  const fieldEntries = Object.entries(props).filter(([key]) => key.startsWith('field_'));

  return (
    <div className={className} data-widget-template={templateName} ref={ref}>
      {fieldEntries.length === 0 ? (
        <p className="p-4 text-center text-gray-400">
          {templateName} — no fields configured yet.
        </p>
      ) : (
        fieldEntries.map(([key, value]) => (
          <div key={key}>{renderFieldValue(key, value)}</div>
        ))
      )}
    </div>
  );
});

