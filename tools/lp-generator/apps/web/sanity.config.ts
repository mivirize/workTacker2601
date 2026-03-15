import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from '@lp-generator/sanity-schemas'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

export default defineConfig({
  name: 'lp-generator',
  title: 'LP Generator',
  projectId,
  dataset,
  basePath: '/studio',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Hearings')
              .icon(() => '📋')
              .child(
                S.documentTypeList('hearing')
                  .title('Hearings')
              ),
            S.listItem()
              .title('LPs')
              .icon(() => '📄')
              .child(
                S.documentTypeList('lp')
                  .title('Landing Pages')
              ),
            S.listItem()
              .title('Templates')
              .icon(() => '📐')
              .child(
                S.documentTypeList('template')
                  .title('Templates')
              ),
            S.divider(),
            ...S.documentTypeListItems().filter(
              (item) => !['hearing', 'lp', 'template'].includes(item.getId() ?? '')
            ),
          ]),
    }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
  },
})
