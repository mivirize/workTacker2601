import { defineType, defineField } from 'sanity'

export const testimonialBlock = defineType({
  name: 'testimonialBlock',
  title: 'Testimonial Section',
  type: 'object',
  fields: [
    defineField({
      name: 'sectionTitle',
      title: 'Section Title',
      type: 'string',
      initialValue: 'What Our Customers Say',
    }),
    defineField({
      name: 'sectionSubtitle',
      title: 'Section Subtitle',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'testimonials',
      title: 'Testimonials',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'quote', title: 'Quote', type: 'text', rows: 3, validation: (rule) => rule.required() },
            { name: 'authorName', title: 'Author Name', type: 'string', validation: (rule) => rule.required() },
            { name: 'authorTitle', title: 'Author Title/Position', type: 'string' },
            { name: 'authorCompany', title: 'Author Company', type: 'string' },
            { name: 'authorImage', title: 'Author Photo', type: 'image', options: { hotspot: true } },
            { name: 'rating', title: 'Rating (1-5)', type: 'number', validation: (rule) => rule.min(1).max(5) },
          ],
        },
      ],
      validation: (rule) => rule.min(1).max(8),
    }),
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          { title: 'Carousel', value: 'carousel' },
          { title: 'Grid', value: 'grid' },
          { title: 'Single Featured', value: 'featured' },
        ],
      },
      initialValue: 'grid',
    }),
    defineField({
      name: 'showRating',
      title: 'Show Star Rating',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: 'sectionTitle', testimonials: 'testimonials' },
    prepare({ title, testimonials }) {
      return {
        title: title ?? 'Testimonial Section',
        subtitle: `${testimonials?.length ?? 0} testimonials`,
      }
    },
  },
})
