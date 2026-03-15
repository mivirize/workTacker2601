import { defineType, defineField } from 'sanity'

export const imageGalleryBlock = defineType({
  name: 'imageGalleryBlock',
  title: 'Image Gallery Section',
  type: 'object',
  fields: [
    defineField({
      name: 'sectionTitle',
      title: 'Section Title',
      type: 'string',
    }),
    defineField({
      name: 'sectionSubtitle',
      title: 'Section Subtitle',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'image', title: 'Image', type: 'image', options: { hotspot: true }, validation: (rule) => rule.required() },
            { name: 'caption', title: 'Caption', type: 'string' },
            { name: 'alt', title: 'Alt Text', type: 'string' },
          ],
        },
      ],
      validation: (rule) => rule.min(1).max(12),
    }),
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          { title: 'Grid (3 columns)', value: 'grid-3' },
          { title: 'Grid (4 columns)', value: 'grid-4' },
          { title: 'Masonry', value: 'masonry' },
        ],
      },
      initialValue: 'grid-3',
    }),
  ],
  preview: {
    select: { title: 'sectionTitle', images: 'images' },
    prepare({ title, images }) {
      return {
        title: title ?? 'Image Gallery',
        subtitle: `${images?.length ?? 0} images`,
      }
    },
  },
})
