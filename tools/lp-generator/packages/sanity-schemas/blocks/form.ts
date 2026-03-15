import { defineType, defineField } from 'sanity'

export const formBlock = defineType({
  name: 'formBlock',
  title: 'Contact Form Section',
  type: 'object',
  fields: [
    defineField({
      name: 'sectionTitle',
      title: 'Section Title',
      type: 'string',
      initialValue: 'Contact Us',
    }),
    defineField({
      name: 'sectionSubtitle',
      title: 'Section Subtitle',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'formFields',
      title: 'Form Fields',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'fieldName', title: 'Field Name (ID)', type: 'string', validation: (rule) => rule.required() },
            { name: 'fieldLabel', title: 'Field Label', type: 'string', validation: (rule) => rule.required() },
            {
              name: 'fieldType',
              title: 'Field Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Text', value: 'text' },
                  { title: 'Email', value: 'email' },
                  { title: 'Phone', value: 'tel' },
                  { title: 'Number', value: 'number' },
                  { title: 'Textarea', value: 'textarea' },
                  { title: 'Select', value: 'select' },
                  { title: 'Checkbox', value: 'checkbox' },
                  { title: 'Radio', value: 'radio' },
                ],
              },
              initialValue: 'text',
            },
            { name: 'placeholder', title: 'Placeholder', type: 'string' },
            { name: 'required', title: 'Required', type: 'boolean', initialValue: false },
            { name: 'defaultValue', title: 'Default Value', type: 'string' },
            {
              name: 'validation',
              title: 'Validation Rules',
              type: 'object',
              fields: [
                { name: 'pattern', title: 'Pattern (Regex)', type: 'string' },
                { name: 'min', title: 'Min Value', type: 'number' },
                { name: 'max', title: 'Max Value', type: 'number' },
                { name: 'minLength', title: 'Min Length', type: 'number' },
                { name: 'maxLength', title: 'Max Length', type: 'number' },
              ],
            },
            {
              name: 'options',
              title: 'Options (for select/radio/checkbox)',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    { name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required() },
                    { name: 'value', title: 'Value', type: 'string', validation: (rule) => rule.required() },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'submitButtonText',
      title: 'Submit Button Text',
      type: 'string',
      initialValue: 'Submit',
    }),
    defineField({
      name: 'successMessage',
      title: 'Success Message',
      type: 'text',
      rows: 2,
      initialValue: 'Thank you for your inquiry. We will get back to you soon.',
    }),
  ],
  preview: {
    select: { title: 'sectionTitle', fields: 'formFields' },
    prepare({ title, fields }) {
      return {
        title: title ?? 'Contact Form',
        subtitle: `${fields?.length ?? 0} fields`,
      }
    },
  },
})
