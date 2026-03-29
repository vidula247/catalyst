import { Group, List, Style, TextArea, TextInput } from '@makeswift/runtime/controls';

import { runtime } from '~/lib/makeswift/runtime';

import { MSSeoContent } from './client';

runtime.registerComponent(MSSeoContent, {
  type: 'section-seo-content',
  label: 'Sections / SEO Content',
  icon: 'text',
  props: {
    className: Style(),
    headline: TextInput({ label: 'Headline', defaultValue: 'Your Store Headline' }),
    subheadline: TextInput({ label: 'Subheadline', defaultValue: 'Supporting tagline' }),
    introText: TextArea({ label: 'Intro text', defaultValue: 'Introductory paragraph...' }),
    features: List({
      label: 'Features',
      type: Group({
        props: {
          imageSrc: TextInput({ label: 'Image URL' }),
          imageAlt: TextInput({ label: 'Image alt text' }),
          title: TextInput({ label: 'Title' }),
          description: TextArea({ label: 'Description' }),
        },
      }),
      getItemLabel(item) {
        return item?.title || 'Feature';
      },
    }),
    closingHeadline: TextInput({ label: 'Closing headline', defaultValue: 'Closing headline' }),
    closingText: TextArea({ label: 'Closing text', defaultValue: 'Closing paragraph...' }),
  },
});
