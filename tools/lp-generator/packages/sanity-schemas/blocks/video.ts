import { defineType, defineField } from 'sanity'

export const videoBlock = defineType({
  name: 'videoBlock',
  title: 'Video Section',
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
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      description: 'YouTube or Vimeo URL',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'thumbnail',
      title: 'Custom Thumbnail',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          { title: 'Full Width', value: 'full-width' },
          { title: 'Centered', value: 'centered' },
          { title: 'With Side Content', value: 'side-content' },
        ],
      },
      initialValue: 'centered',
    }),
    defineField({
      name: 'sideContent',
      title: 'Side Content',
      type: 'text',
      rows: 4,
      hidden: ({ parent }) => parent?.layout !== 'side-content',
    }),
  ],
  preview: {
    select: { title: 'sectionTitle', videoUrl: 'videoUrl' },
    prepare({ title, videoUrl }) {
      return {
        title: title ?? 'Video Section',
        subtitle: videoUrl ?? 'No video URL',
      }
    },
  },
})
