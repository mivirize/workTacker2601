import { defineType, defineField } from 'sanity'

export const faqBlock = defineType({
  name: 'faqBlock',
  title: 'FAQ Section',
  type: 'object',
  fields: [
    defineField({
      name: 'sectionTitle',
      title: 'Section Title',
      type: 'string',
      initialValue: 'Frequently Asked Questions',
    }),
    defineField({
      name: 'sectionSubtitle',
      title: 'Section Subtitle',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'faqs',
      title: 'FAQs',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'question', title: 'Question', type: 'string', validation: (rule) => rule.required() },
            { name: 'answer', title: 'Answer', type: 'text', rows: 3, validation: (rule) => rule.required() },
            { name: 'category', title: 'Category (optional)', type: 'string' },
          ],
        },
      ],
      validation: (rule) => rule.min(1).max(20),
    }),
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          { title: 'Accordion', value: 'accordion' },
          { title: 'Two Columns', value: 'two-columns' },
          { title: 'Simple List', value: 'list' },
        ],
      },
      initialValue: 'accordion',
    }),
  ],
  preview: {
    select: { title: 'sectionTitle', faqs: 'faqs' },
    prepare({ title, faqs }) {
      return {
        title: title ?? 'FAQ Section',
        subtitle: `${faqs?.length ?? 0} questions`,
      }
    },
  },
})
