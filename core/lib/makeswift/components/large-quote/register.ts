import { Select, Style, TextArea, TextInput } from '@makeswift/runtime/controls';

import { runtime } from '~/lib/makeswift/runtime';

import { MSLargeQuote } from './client';

runtime.registerComponent(MSLargeQuote, {
  type: 'section-large-quote',
  label: 'Sections / Large Quote',
  icon: 'text',
  props: {
    className: Style(),
    quote: TextArea({ label: 'Quote', defaultValue: 'This is an inspiring quote.' }),
    author: TextInput({ label: 'Author', defaultValue: 'Author Name' }),
    role: TextInput({ label: 'Role / Title', defaultValue: 'Position' }),
    accentColor: Select({
      label: 'Accent color',
      options: [
        { value: 'blue', label: 'Blue' },
        { value: 'purple', label: 'Purple' },
        { value: 'green', label: 'Green' },
        { value: 'orange', label: 'Orange' },
        { value: 'red', label: 'Red' },
      ],
      defaultValue: 'blue',
    }),
    size: Select({
      label: 'Size',
      options: [
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' },
        { value: 'x-large', label: 'X-Large' },
      ],
      defaultValue: 'large',
    }),
  },
});
