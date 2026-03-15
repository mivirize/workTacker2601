import { defineType, defineField } from 'sanity'

export const pricingBlock = defineType({
  name: 'pricingBlock',
  title: 'Pricing Section',
  type: 'object',
  fields: [
    defineField({
      name: 'sectionTitle',
      title: 'Section Title',
      type: 'string',
      initialValue: 'Pricing Plans',
    }),
    defineField({
      name: 'sectionSubtitle',
      title: 'Section Subtitle',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'plans',
      title: 'Pricing Plans',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'name', title: 'Plan Name', type: 'string', validation: (rule) => rule.required() },
            { name: 'description', title: 'Plan Description', type: 'text', rows: 2 },
            { name: 'price', title: 'Price', type: 'string', validation: (rule) => rule.required() },
            { name: 'pricePeriod', title: 'Price Period', type: 'string', initialValue: '/month' },
            { name: 'priceNote', title: 'Price Note', type: 'string' },
            { name: 'features', title: 'Features', type: 'array', of: [{ type: 'string' }] },
            { name: 'isPopular', title: 'Highlight as Popular', type: 'boolean', initialValue: false },
            { name: 'ctaText', title: 'CTA Button Text', type: 'string', initialValue: 'Get Started' },
            { name: 'ctaUrl', title: 'CTA Button URL', type: 'string' },
          ],
        },
      ],
      validation: (rule) => rule.min(1).max(4),
    }),
  ],
  preview: {
    select: { title: 'sectionTitle', plans: 'plans' },
    prepare({ title, plans }) {
      return {
        title: title ?? 'Pricing Section',
        subtitle: `${plans?.length ?? 0} plans`,
      }
    },
  },
})
