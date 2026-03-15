'use client'

import { useState } from 'react'
import type { FaqBlock as FaqBlockType, TemplateTier } from '@lp-generator/sanity-schemas/types'

interface FaqBlockProps extends Omit<FaqBlockType, '_type' | '_key'> {
  template: TemplateTier
}

const templatePadding: Record<TemplateTier, string> = {
  simple: 'py-12',
  rich: 'py-16',
  premier: 'py-20',
}

function AccordionItem({ question, answer, isOpen, onToggle }: {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-b border-gray-200">
      <button
        type="button"
        className="w-full py-4 flex items-center justify-between text-left"
        onClick={onToggle}
      >
        <span className="font-medium text-gray-900">{question}</span>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="pb-4 text-gray-600">
          {answer}
        </div>
      )}
    </div>
  )
}

export function FaqBlock({
  sectionTitle,
  sectionSubtitle,
  faqs,
  layout,
  template,
}: FaqBlockProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className={`${templatePadding[template]} bg-white`}>
      <div className="container mx-auto px-4">
        {(sectionTitle || sectionSubtitle) && (
          <div className="text-center mb-12">
            {sectionTitle && (
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {sectionTitle}
              </h2>
            )}
            {sectionSubtitle && (
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {sectionSubtitle}
              </p>
            )}
          </div>
        )}

        {layout === 'accordion' && (
          <div className="max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={faq._key ?? index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === index}
                onToggle={() => setOpenIndex(openIndex === index ? null : index)}
              />
            ))}
          </div>
        )}

        {layout === 'two-columns' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {faqs.map((faq, index) => (
              <div key={faq._key ?? index}>
                <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        )}

        {layout === 'list' && (
          <div className="max-w-3xl mx-auto space-y-8">
            {faqs.map((faq, index) => (
              <div key={faq._key ?? index}>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
