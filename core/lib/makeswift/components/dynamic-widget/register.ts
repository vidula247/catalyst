import { Style } from '@makeswift/runtime/controls';

import {
  buildMakeswiftProps,
  fetchWidgetTemplates,
  type WidgetTemplate,
} from '~/lib/widget-transformer';
import { runtime } from '~/lib/makeswift/runtime';

import { createWidgetComponent } from './factory';

/**
 * Registers a single BigCommerce Widget Template as a Makeswift component.
 *
 * The component type is derived from the template UUID so each template
 * gets its own unique entry in the Makeswift component palette.
 */
function registerWidgetTemplate(template: WidgetTemplate) {
  const schema = template.schema ?? [];
  const dynamicProps = buildMakeswiftProps(schema);
  const Component = createWidgetComponent(template.name);

  runtime.registerComponent(Component, {
    type: `bc-widget-${template.uuid}`,
    label: `Widget / ${template.name}`,
    icon: 'code',
    props: {
      className: Style(),
      ...dynamicProps,
    },
  });
}

/**
 * Fetches all Widget Templates from the BigCommerce API and registers
 * each one as a Makeswift component whose controls are derived from the
 * template's UI-schema fields.
 *
 * Called at module-load time (side-effect import from `components.ts`).
 * Failures are logged but never propagated so that the rest of the
 * Makeswift component palette stays functional.
 */
export async function registerDynamicWidgets() {
  try {
    const templates = await fetchWidgetTemplates();

    for (const template of templates) {
      registerWidgetTemplate(template);
    }

    if (templates.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`[widget-transformer] Registered ${templates.length} widget template(s).`);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[widget-transformer] Failed to register dynamic widgets:', error);
  }
}

// Self-invoking registration — executed when this module is imported.
registerDynamicWidgets();
