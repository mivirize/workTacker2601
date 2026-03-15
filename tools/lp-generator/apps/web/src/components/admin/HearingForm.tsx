'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'

const hearingSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  productName: z.string().min(1, 'Product/Service name is required'),
  productDescription: z.string().optional(),
  uniqueSellingPoints: z.array(z.object({ value: z.string() })).min(1, 'At least 1 USP is required'),
  priceInfo: z.object({
    price: z.string().optional(),
    priceNote: z.string().optional(),
  }).optional(),
  targetAudience: z.string().optional(),
  painPoints: z.array(z.object({ value: z.string() })).optional(),
  desiredOutcome: z.string().optional(),
  templateTier: z.enum(['simple', 'rich', 'premier']),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  notes: z.string().optional(),
})

export type HearingFormData = z.infer<typeof hearingSchema>

interface HearingFormProps {
  defaultValues?: Partial<HearingFormData>
  onSubmit: (data: HearingFormData) => Promise<void>
  isLoading?: boolean
}

export function HearingForm({ defaultValues, onSubmit, isLoading }: HearingFormProps) {
  const form = useForm<HearingFormData>({
    resolver: zodResolver(hearingSchema),
    defaultValues: {
      templateTier: 'simple',
      uniqueSellingPoints: [{ value: '' }],
      painPoints: [{ value: '' }],
      ...defaultValues,
    },
  })

  const {
    fields: uspFields,
    append: appendUsp,
    remove: removeUsp,
  } = useFieldArray({
    control: form.control,
    name: 'uniqueSellingPoints',
  })

  const {
    fields: painFields,
    append: appendPain,
    remove: removePain,
  } = useFieldArray({
    control: form.control,
    name: 'painPoints',
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data)
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section 1: Client Info */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Client Name *</label>
            <input
              {...form.register('clientName')}
              className="input"
              placeholder="Company ABC"
            />
            {form.formState.errors.clientName && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.clientName.message}</p>
            )}
          </div>

          <div>
            <label className="label">Contact Person</label>
            <input
              {...form.register('contactPerson')}
              className="input"
              placeholder="Taro Yamada"
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">Contact Email</label>
            <input
              {...form.register('contactEmail')}
              type="email"
              className="input"
              placeholder="contact@example.com"
            />
            {form.formState.errors.contactEmail && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.contactEmail.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Product/Service */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Product/Service Information</h3>
        <div className="space-y-4">
          <div>
            <label className="label">Product/Service Name *</label>
            <input
              {...form.register('productName')}
              className="input"
              placeholder="Cloud Service XYZ"
            />
            {form.formState.errors.productName && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.productName.message}</p>
            )}
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              {...form.register('productDescription')}
              className="input min-h-[100px]"
              placeholder="Description of the product or service..."
            />
          </div>

          <div>
            <label className="label">USP (Unique Selling Points) *</label>
            <div className="space-y-2">
              {uspFields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <input
                    {...form.register(`uniqueSellingPoints.${index}.value`)}
                    className="input flex-1"
                    placeholder={`USP ${index + 1}`}
                  />
                  {uspFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeUsp(index)}
                      className="btn btn-outline px-3"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {uspFields.length < 5 && (
                <button
                  type="button"
                  onClick={() => appendUsp({ value: '' })}
                  className="btn btn-secondary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add USP
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Price</label>
              <input
                {...form.register('priceInfo.price')}
                className="input"
                placeholder="¥10,000/month"
              />
            </div>
            <div>
              <label className="label">Price Note</label>
              <input
                {...form.register('priceInfo.priceNote')}
                className="input"
                placeholder="Tax excluded"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Target */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Target Information</h3>
        <div className="space-y-4">
          <div>
            <label className="label">Target Audience</label>
            <textarea
              {...form.register('targetAudience')}
              className="input min-h-[80px]"
              placeholder="SMB companies, marketing teams..."
            />
          </div>

          <div>
            <label className="label">Customer Pain Points</label>
            <div className="space-y-2">
              {painFields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <input
                    {...form.register(`painPoints.${index}.value`)}
                    className="input flex-1"
                    placeholder={`Pain point ${index + 1}`}
                  />
                  {painFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePain(index)}
                      className="btn btn-outline px-3"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => appendPain({ value: '' })}
                className="btn btn-secondary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Pain Point
              </button>
            </div>
          </div>

          <div>
            <label className="label">Desired Outcome</label>
            <textarea
              {...form.register('desiredOutcome')}
              className="input min-h-[80px]"
              placeholder="Expected results for customers..."
            />
          </div>
        </div>
      </div>

      {/* Section 4: Design */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Design Preferences</h3>
        <div className="space-y-4">
          <div>
            <label className="label">Template Tier *</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              {[
                { value: 'simple', label: 'Simple', desc: 'Basic layout with essential sections' },
                { value: 'rich', label: 'Rich', desc: 'Detailed layout with more sections' },
                { value: 'premier', label: 'Premier', desc: 'Premium layout with all features' },
              ].map((tier) => (
                <label
                  key={tier.value}
                  className={`
                    relative p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${form.watch('templateTier') === tier.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <input
                    type="radio"
                    {...form.register('templateTier')}
                    value={tier.value}
                    className="sr-only"
                  />
                  <div className="font-semibold text-gray-900">{tier.label}</div>
                  <div className="text-sm text-gray-500 mt-1">{tier.desc}</div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  {...form.register('primaryColor')}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <input
                  {...form.register('primaryColor')}
                  className="input flex-1"
                  placeholder="#3B82F6"
                />
              </div>
            </div>
            <div>
              <label className="label">Secondary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  {...form.register('secondaryColor')}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <input
                  {...form.register('secondaryColor')}
                  className="input flex-1"
                  placeholder="#1E40AF"
                />
              </div>
            </div>
            <div>
              <label className="label">Accent Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  {...form.register('accentColor')}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <input
                  {...form.register('accentColor')}
                  className="input flex-1"
                  placeholder="#F59E0B"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: Notes */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
        <textarea
          {...form.register('notes')}
          className="input min-h-[100px]"
          placeholder="Additional notes or requirements..."
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => form.reset()}
        >
          Reset
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Hearing'}
        </button>
      </div>
    </form>
  )
}
