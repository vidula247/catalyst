import { Image, Link, Number, Select, Style, TextArea, TextInput } from '@makeswift/runtime/controls';

import { runtime } from '~/lib/makeswift/runtime';

import { MSHeroBanner } from './client';

runtime.registerComponent(MSHeroBanner, {
  type: 'section-hero-banner',
  label: 'Sections / Hero Banner',
  icon: 'layout',
  props: {
    className: Style(),
    title: TextInput({ label: 'Title', defaultValue: 'Welcome to Our Store' }),
    subtitle: TextArea({ label: 'Subtitle', defaultValue: 'Discover our latest collection' }),
    imageSrc: Image({ label: 'Background image' }),
    imageAlt: TextInput({ label: 'Image alt', defaultValue: 'Hero background' }),
    buttonText: TextInput({ label: 'Button text', defaultValue: 'Shop Now' }),
    buttonLink: Link({ label: 'Button link' }),
    textAlign: Select({
      label: 'Text alignment',
      options: [
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
      ],
      defaultValue: 'center',
    }),
    overlayOpacity: Number({
      label: 'Overlay opacity',
      defaultValue: 40,
      min: 0,
      max: 100,
      suffix: '%',
    }),
    minHeight: Select({
      label: 'Height',
      options: [
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' },
        { value: 'full', label: 'Full screen' },
      ],
      defaultValue: 'medium',
    }),
    textColor: Select({
      label: 'Text color',
      options: [
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
      ],
      defaultValue: 'light',
    }),
  },
});
