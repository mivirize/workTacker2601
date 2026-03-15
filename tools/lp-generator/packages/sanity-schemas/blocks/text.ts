import { defineType, defineField } from 'sanity'

export const textBlock = defineType({
  name: 'textBlock',
  title: 'Text Section',
  type: 'object',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'text',
      rows: 8,
    }),
    defineField({
      name: 'maxWidth',
      title: 'Max Width',
      type: 'string',
      options: {
        list: [
          { title: 'Narrow', value: 'narrow' },
          { title: 'Medium', value: 'medium' },
          { title: 'Wide', value: 'wide' },
        ],
      },
      initialValue: 'medium',
    }),
    defineField({
      name: 'alignment',
      title: 'Alignment',
      type: 'string',
      options: {
        list: [
          { title: 'Left', value: 'left' },
          { title: 'Center', value: 'center' },
        ],
      },
      initialValue: 'left',
    }),
  ],
  preview: {
    select: { title: 'heading', content: 'content' },
    prepare({ title, content }) {
      return {
        title: title ?? 'Text Section',
        subtitle: content?.slice(0, 50) ?? '',
      }
    },
  },
})
