import { defineType, defineField } from 'sanity'

export const ctaBlock = defineType({
  name: 'ctaBlock',
  title: 'CTA Section',
  type: 'object',
  fields: [
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'primaryButtonText',
      title: 'Primary Button Text',
      type: 'string',
    }),
    defineField({
      name: 'primaryButtonUrl',
      title: 'Primary Button URL',
      type: 'string',
    }),
    defineField({
      name: 'secondaryButtonText',
      title: 'Secondary Button Text',
      type: 'string',
    }),
    defineField({
      name: 'secondaryButtonUrl',
      title: 'Secondary Button URL',
      type: 'string',
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Background Color',
      type: 'string',
      options: {
        list: [
          { title: 'Primary', value: 'primary' },
          { title: 'Secondary', value: 'secondary' },
          { title: 'White', value: 'white' },
          { title: 'Gray', value: 'gray' },
        ],
      },
      initialValue: 'primary',
    }),
  ],
  preview: {
    select: { title: 'headline' },
    prepare({ title }) {
      return { title: title ?? 'CTA Section', subtitle: 'CTA' }
    },
  },
})
