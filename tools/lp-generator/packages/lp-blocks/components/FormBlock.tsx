import type { FormBlock as FormBlockType, TemplateTier } from '@lp-generator/sanity-schemas/types'

interface FormBlockProps extends Omit<FormBlockType, '_type' | '_key'> {
  template: TemplateTier
}

const templatePadding: Record<TemplateTier, string> = {
  simple: 'py-12',
  rich: 'py-16',
  premier: 'py-20',
}

export function FormBlock({
  sectionTitle,
  sectionSubtitle,
  formFields,
  submitButtonText = 'Submit',
  successMessage,
  template,
}: FormBlockProps) {
  return (
    <section className={`${templatePadding[template]} bg-white`}>
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          {(sectionTitle || sectionSubtitle) && (
            <div className="text-center mb-10">
              {sectionTitle && (
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {sectionTitle}
                </h2>
              )}
              {sectionSubtitle && (
                <p className="text-lg text-gray-600">
                  {sectionSubtitle}
                </p>
              )}
            </div>
          )}

          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault()
              // Form submission would be handled here
              alert(successMessage ?? 'Thank you for your submission!')
            }}
          >
            {formFields.map((field, index) => (
              <div key={field._key ?? index}>
                <label
                  htmlFor={field.fieldName}
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {field.fieldLabel}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {field.fieldType === 'textarea' ? (
                  <textarea
                    id={field.fieldName}
                    name={field.fieldName}
                    placeholder={field.placeholder}
                    required={field.required}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--lp-primary)] focus:border-transparent outline-none transition-all resize-none"
                  />
                ) : field.fieldType === 'select' ? (
                  <select
                    id={field.fieldName}
                    name={field.fieldName}
                    required={field.required}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--lp-primary)] focus:border-transparent outline-none transition-all bg-white"
                  >
                    <option value="">{field.placeholder ?? 'Select an option'}</option>
                    {field.options?.map((option) => (
                      <option key={option._key} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.fieldType === 'checkbox' ? (
                  <div className="space-y-2">
                    {field.options?.map((option) => (
                      <label key={option._key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name={field.fieldName}
                          value={option.value}
                          defaultChecked={field.defaultValue === option.value}
                          className="w-4 h-4 text-[var(--lp-primary)] border-gray-300 rounded focus:ring-[var(--lp-primary)]"
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                ) : field.fieldType === 'radio' ? (
                  <div className="space-y-2">
                    {field.options?.map((option) => (
                      <label key={option._key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={field.fieldName}
                          value={option.value}
                          defaultChecked={field.defaultValue === option.value}
                          required={field.required}
                          className="w-4 h-4 text-[var(--lp-primary)] border-gray-300 focus:ring-[var(--lp-primary)]"
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    type={field.fieldType}
                    id={field.fieldName}
                    name={field.fieldName}
                    placeholder={field.placeholder}
                    required={field.required}
                    defaultValue={field.defaultValue}
                    pattern={field.validation?.pattern}
                    min={field.validation?.min}
                    max={field.validation?.max}
                    minLength={field.validation?.minLength}
                    maxLength={field.validation?.maxLength}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--lp-primary)] focus:border-transparent outline-none transition-all"
                  />
                )}
              </div>
            ))}

            <button
              type="submit"
              className="w-full py-4 px-6 bg-[var(--lp-primary)] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              {submitButtonText}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
