import { defineType, defineField } from 'sanity'

export const benefitBlock = defineType({
  name: 'benefitBlock',
  title: 'Benefit Section',
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
      name: 'benefits',
      title: 'Benefits',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'problem', title: 'Problem/Before', type: 'string' },
            { name: 'solution', title: 'Solution/After', type: 'string' },
            { name: 'icon', title: 'Icon', type: 'string' },
            { name: 'description', title: 'Description', type: 'text', rows: 2 },
          ],
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
          { title: 'Before/After Cards', value: 'before-after' },
          { title: 'Numbered List', value: 'numbered' },
          { title: 'Icon Grid', value: 'icon-grid' },
        ],
      },
      initialValue: 'before-after',
    }),
  ],
  preview: {
    select: { title: 'sectionTitle', benefits: 'benefits' },
    prepare({ title, benefits }) {
      return {
        title: title ?? 'Benefit Section',
        subtitle: `${benefits?.length ?? 0} benefits`,
      }
    },
  },
})
