import { forwardRef } from 'react';

import { DynamicWidget } from './client';

/**
 * Creates a wrapper component for a specific widget template that
 * hard-codes the `templateName` prop.  Used by `register.ts` so
 * that `templateName` does not need to be exposed as a Makeswift control.
 *
 * This file intentionally omits 'use client' so that the factory function
 * can be called from server-side module evaluation (component registration).
 * The returned component references the client-side `DynamicWidget`, which
 * Next.js will correctly handle at the component boundary.
 */
export function createWidgetComponent(templateName: string) {
  return forwardRef<HTMLDivElement, { className?: string }>(
    function WidgetWrapper(props, ref) {
      return <DynamicWidget {...props} ref={ref} templateName={templateName} />;
    },
  );
}
