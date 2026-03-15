import { defineType, defineField } from 'sanity'

export const featureBlock = defineType({
  name: 'featureBlock',
  title: 'Feature Section',
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
      name: 'features',
      title: 'Features',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'icon', title: 'Icon (emoji or icon name)', type: 'string' },
            { name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required() },
            { name: 'description', title: 'Description', type: 'text', rows: 2 },
            { name: 'image', title: 'Image', type: 'image', options: { hotspot: true } },
          ],
          preview: {
            select: { title: 'title', icon: 'icon' },
            prepare({ title, icon }) {
              return { title: title ?? 'Feature', subtitle: icon }
            },
          },
        },
      ],
      validation: (rule) => rule.min(1).max(6),
    }),
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          { title: 'Grid (2 columns)', value: 'grid-2' },
          { title: 'Grid (3 columns)', value: 'grid-3' },
          { title: 'List', value: 'list' },
        ],
      },
      initialValue: 'grid-3',
    }),
  ],
  preview: {
    select: { title: 'sectionTitle', features: 'features' },
    prepare({ title, features }) {
      return {
        title: title ?? 'Feature Section',
        subtitle: `${features?.length ?? 0} features`,
      }
    },
  },
})
