/**
 * Form Service
 *
 * Detects forms in HTML, applies form backend configurations,
 * and generates code for form submissions.
 */

import * as cheerio from 'cheerio'
import type {
  DetectedForm,
  DetectedField,
  FormConfig,
} from '../stores/form-store'

/**
 * Detect all forms in the HTML and extract their fields
 */
export function detectForms(html: string): DetectedForm[] {
  const $ = cheerio.load(html)
  const forms: DetectedForm[] = []

  $('form').each((index, element) => {
    const $form = $(element)

    // Generate selector: prefer id, then name, then nth-of-type
    const formId = $form.attr('id')
    const formName = $form.attr('name')
    const selector = formId
      ? `#${formId}`
      : formName
        ? `form[name="${formName}"]`
        : `form:nth-of-type(${index + 1})`

    const id = formId || formName || `form-${index}`
    const action = $form.attr('action') || ''
    const method = ($form.attr('method') || 'POST').toUpperCase()

    // Extract fields
    const fields: DetectedField[] = []
    $form.find('input, textarea, select').each((_, fieldEl) => {
      const $field = $(fieldEl)
      const name = $field.attr('name')
      if (!name) return

      // Skip hidden and submit inputs
      const type = $field.attr('type') || 'text'
      if (type === 'hidden' || type === 'submit') return

      // Determine label
      const fieldId = $field.attr('id')
      let label = ''
      if (fieldId) {
        const $label = $(`label[for="${fieldId}"]`)
        label = $label.text().trim()
      }
      if (!label) {
        // Check parent label
        const $parentLabel = $field.closest('label')
        if ($parentLabel.length > 0) {
          label = $parentLabel.clone().children().remove().end().text().trim()
        }
      }
      if (!label) {
        label = $field.attr('placeholder') || name
      }

      // Generate field selector
      const fieldSelector = fieldId
        ? `#${fieldId}`
        : `[name="${name}"]`

      fields.push({
        name,
        type: $field.is('textarea') ? 'textarea' : $field.is('select') ? 'select' : type,
        label,
        required: $field.attr('required') !== undefined,
        selector: fieldSelector,
      })
    })

    forms.push({ id, selector, action, method, fields })
  })

  return forms
}

/**
 * Escape a string for safe insertion into a JavaScript string literal
 */
function escapeJsString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/</g, '\\x3C')
}

/**
 * Escape a string for safe insertion into an HTML attribute
 */
function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Apply form configuration to HTML
 *
 * Modifies form action, method, adds hidden fields, and injects JS for webhooks
 */
export function applyFormConfig(html: string, configs: Record<string, FormConfig>): string {
  const $ = cheerio.load(html)

  for (const [formId, config] of Object.entries(configs)) {
    const $form = $(config.formSelector || `#${formId}`)
    if ($form.length === 0) continue

    switch (config.provider) {
      case 'formspree':
        applyFormspree($form, config)
        break
      case 'custom':
        applyCustom($form, config)
        break
      case 'google-forms':
        applyGoogleForms($form, config)
        break
      case 'webhook':
        applyWebhook($, $form, config, formId)
        break
    }

    // Add hidden fields
    for (const hidden of config.hiddenFields) {
      if (hidden.name && hidden.value) {
        // Remove existing hidden field with same name
        $form.find(`input[type="hidden"][name="${hidden.name}"]`).remove()
        $form.prepend(`<input type="hidden" name="${escapeHtmlAttr(hidden.name)}" value="${escapeHtmlAttr(hidden.value)}" />`)
      }
    }
  }

  return $.html()
}

function applyFormspree(
  $form: cheerio.Cheerio<any>,
  config: FormConfig
): void {
  if (!config.formspree.formId) return
  $form.attr('action', `https://formspree.io/f/${config.formspree.formId}`)
  $form.attr('method', 'POST')

  // Add redirect hidden field if configured
  if (config.successAction === 'redirect' && config.successUrl) {
    $form.find('input[name="_next"]').remove()
    $form.prepend(`<input type="hidden" name="_next" value="${config.successUrl}" />`)
  }
}

function applyCustom(
  $form: cheerio.Cheerio<any>,
  config: FormConfig
): void {
  if (!config.custom.actionUrl) return
  $form.attr('action', config.custom.actionUrl)
  $form.attr('method', config.custom.method)
}

function applyGoogleForms(
  $form: cheerio.Cheerio<any>,
  config: FormConfig
): void {
  if (!config.googleForms.formUrl) return

  // Extract form response URL
  const formUrl = config.googleForms.formUrl
    .replace('/viewform', '/formResponse')
    .replace('/edit', '/formResponse')

  $form.attr('action', formUrl)
  $form.attr('method', 'POST')
  $form.attr('target', '_blank')

  // Rename fields to Google Forms entry IDs
  for (const [fieldName, entryId] of Object.entries(config.googleForms.entryMappings)) {
    const $field = $form.find(`[name="${fieldName}"]`)
    if ($field.length > 0 && entryId) {
      $field.attr('name', entryId)
    }
  }
}

function applyWebhook(
  $: cheerio.CheerioAPI,
  $form: cheerio.Cheerio<any>,
  config: FormConfig,
  formId: string
): void {
  if (!config.webhook.url) return

  // Prevent default form submission
  $form.removeAttr('action')

  // Generate submit handler script
  const headers = JSON.stringify(config.webhook.headers)
  const escapedUrl = escapeJsString(config.webhook.url)
  const escapedSelector = escapeJsString(config.formSelector || '#' + formId)
  const successAction = config.successAction === 'redirect'
    ? `window.location.href = '${escapeJsString(config.successUrl)}';`
    : `alert('${escapeJsString(config.successMessage)}');`

  const script = `
<script>
(function() {
  var form = document.querySelector('${escapedSelector}');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var formData = new FormData(form);
    var data = {};
    formData.forEach(function(value, key) { data[key] = value; });
    fetch('${escapedUrl}', {
      method: 'POST',
      headers: Object.assign({'Content-Type': 'application/json'}, ${headers}),
      body: JSON.stringify(data)
    })
    .then(function(res) {
      if (res.ok) { ${successAction} }
      else { alert('Error: ' + res.status); }
    })
    .catch(function(err) { alert('Error: ' + err.message); });
  });
})();
</script>`

  // Inject script before </body>
  const $body = $('body')
  if ($body.length > 0) {
    $body.append(script)
  }
}

/**
 * Generate a preview of what will change in the form
 */
export function generateFormPreview(config: FormConfig): string {
  const lines: string[] = []

  switch (config.provider) {
    case 'formspree':
      lines.push(`Provider: Formspree`)
      if (config.formspree.formId) {
        lines.push(`Action: https://formspree.io/f/${config.formspree.formId}`)
      }
      break
    case 'custom':
      lines.push(`Provider: Custom`)
      if (config.custom.actionUrl) {
        lines.push(`Action: ${config.custom.actionUrl}`)
        lines.push(`Method: ${config.custom.method}`)
      }
      break
    case 'google-forms':
      lines.push(`Provider: Google Forms`)
      if (config.googleForms.formUrl) {
        lines.push(`URL: ${config.googleForms.formUrl}`)
      }
      break
    case 'webhook':
      lines.push(`Provider: Webhook`)
      if (config.webhook.url) {
        lines.push(`URL: ${config.webhook.url}`)
      }
      break
  }

  if (config.hiddenFields.length > 0) {
    lines.push(`Hidden fields: ${config.hiddenFields.length}`)
  }

  return lines.join('\n')
}
