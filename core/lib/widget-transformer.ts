import { Color, Image, TextInput } from '@makeswift/runtime/controls';

/**
 * A single field in a BigCommerce Widget Template's UI schema.
 *
 * The `type` discriminates the kind of control the field represents
 * (e.g. "color", "text", "image"). Additional fields like `label`
 * and `default` may be present depending on the template.
 */
export interface WidgetSchemaField {
  type: string;
  label?: string;
  default?: string;
}

/**
 * The shape of a BigCommerce Widget Template as returned by the
 * `/v3/content/widget-templates` REST API endpoint.
 */
export interface WidgetTemplate {
  uuid: string;
  name: string;
  schema?: WidgetSchemaField[];
  template: string;
  kind?: string;
  date_created?: string;
  date_modified?: string;
}

interface WidgetTemplatesResponse {
  data: WidgetTemplate[];
}

/**
 * Fetch all Widget Templates directly from the BigCommerce REST API.
 *
 * This function runs server-side (during module evaluation for component
 * registration), so it calls the BigCommerce API directly rather than
 * going through a local Next.js API route.
 */
export async function fetchWidgetTemplates(): Promise<WidgetTemplate[]> {
  const authToken = process.env.BIGCOMMERCE_ACCESS_TOKEN;
  const storeHash = process.env.BIGCOMMERCE_STORE_HASH;

  if (!authToken || !storeHash) {
    return [];
  }

  const response = await fetch(
    `https://api.bigcommerce.com/stores/${storeHash}/v3/content/widget-templates`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Auth-Token': authToken,
      },
    },
  );

  if (!response.ok) {
    if (response.status === 403) {
      return [];
    }

    throw new Error(`Failed to fetch widget templates: ${response.status}`);
  }

  const json = (await response.json()) as WidgetTemplatesResponse;

  return json.data ?? [];
}

// ---------------------------------------------------------------------------
// Schema-field → Makeswift control mapping
// ---------------------------------------------------------------------------

type MakeswiftControl = ReturnType<typeof Color | typeof TextInput | typeof Image>;

/**
 * Maps a single BigCommerce Widget Template UI-schema field to an
 * equivalent Makeswift editor control.
 *
 * Supported mappings:
 *  - `"color"`  → `Color()`
 *  - `"text"`   → `TextInput()`
 *  - `"image"`  → `Image()`
 *
 * Returns `null` for unrecognised field types so callers can skip them.
 */
export function mapSchemaFieldToControl(field: WidgetSchemaField): MakeswiftControl | null {
  const label = field.label ?? field.type;

  switch (field.type) {
    case 'color':
      return Color({ label });

    case 'text':
      return TextInput({
        label,
        defaultValue: typeof field.default === 'string' ? field.default : '',
      });

    case 'image':
      return Image({ label });

    default:
      return null;
  }
}

/**
 * Converts an entire Widget Template schema array into a Makeswift `props`
 * record suitable for `runtime.registerComponent()`.
 *
 * Each schema field whose `type` is recognised is keyed by its index-prefixed
 * name (e.g. `"field_0_Background"`) to guarantee uniqueness.
 */
export function buildMakeswiftProps(
  schema: WidgetSchemaField[],
): Record<string, MakeswiftControl> {
  const props: Record<string, MakeswiftControl> = {};

  for (const [index, field] of schema.entries()) {
    const control = mapSchemaFieldToControl(field);

    if (control) {
      const key = `field_${index}_${(field.label ?? field.type).replace(/\s+/g, '_')}`;

      props[key] = control;
    }
  }

  return props;
}
