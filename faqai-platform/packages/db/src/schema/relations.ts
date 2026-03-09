import { relations } from 'drizzle-orm';
import { organizations, users, memberships, apiKeys, sessions } from './auth.js';
import {
  sites,
  crawlJobs,
  crawlPages,
  pageScreenshots,
} from './sites.js';
import {
  faqCategories,
  faqItems,
  faqItemScreenshots,
  faqTags,
  faqItemTags,
  faqVersions,
  faqFeedbacks,
  faqRelatedItems,
} from './faq.js';
import {
  chatbots,
  scenarios,
  scenarioNodes,
  scenarioEdges,
  chatSessions,
  chatMessages,
} from './chatbot.js';
import {
  inquiries,
  responseTemplates,
  templateTags,
  templateTagAssignments,
  aiResponses,
} from './inquiry.js';
import { analyticsEvents, usageRecords } from './analytics.js';
import { faqEmbeddings } from './embeddings.js';
import { llmProviderConfigs } from './common.js';

// ---------------------------------------------------------------------------
// organizations
// ---------------------------------------------------------------------------

export const organizationsRelations = relations(
  organizations,
  ({ many }) => ({
    memberships: many(memberships),
    apiKeys: many(apiKeys),
    sites: many(sites),
    crawlJobs: many(crawlJobs),
    crawlPages: many(crawlPages),
    pageScreenshots: many(pageScreenshots),
    faqCategories: many(faqCategories),
    faqItems: many(faqItems),
    faqTags: many(faqTags),
    faqFeedbacks: many(faqFeedbacks),
    chatbots: many(chatbots),
    scenarios: many(scenarios),
    scenarioNodes: many(scenarioNodes),
    chatSessions: many(chatSessions),
    chatMessages: many(chatMessages),
    inquiries: many(inquiries),
    responseTemplates: many(responseTemplates),
    templateTags: many(templateTags),
    aiResponses: many(aiResponses),
    analyticsEvents: many(analyticsEvents),
    usageRecords: many(usageRecords),
    llmProviderConfigs: many(llmProviderConfigs),
  }),
);

// ---------------------------------------------------------------------------
// users
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
  sessions: many(sessions),
  createdApiKeys: many(apiKeys),
  assignedInquiries: many(inquiries),
  createdTemplates: many(responseTemplates),
  faqVersionsChanged: many(faqVersions),
}));

// ---------------------------------------------------------------------------
// memberships
// ---------------------------------------------------------------------------

export const membershipsRelations = relations(memberships, ({ one }) => ({
  organization: one(organizations, {
    fields: [memberships.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------------
// apiKeys
// ---------------------------------------------------------------------------

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  organization: one(organizations, {
    fields: [apiKeys.organizationId],
    references: [organizations.id],
  }),
  createdBy: one(users, {
    fields: [apiKeys.createdBy],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------------
// sessions
// ---------------------------------------------------------------------------

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------------
// sites
// ---------------------------------------------------------------------------

export const sitesRelations = relations(sites, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [sites.organizationId],
    references: [organizations.id],
  }),
  crawlJobs: many(crawlJobs),
  crawlPages: many(crawlPages),
  faqCategories: many(faqCategories),
  faqItems: many(faqItems),
  chatbots: many(chatbots),
  analyticsEvents: many(analyticsEvents),
}));

// ---------------------------------------------------------------------------
// crawlJobs
// ---------------------------------------------------------------------------

export const crawlJobsRelations = relations(crawlJobs, ({ one, many }) => ({
  site: one(sites, {
    fields: [crawlJobs.siteId],
    references: [sites.id],
  }),
  organization: one(organizations, {
    fields: [crawlJobs.organizationId],
    references: [organizations.id],
  }),
  crawlPages: many(crawlPages),
}));

// ---------------------------------------------------------------------------
// crawlPages
// ---------------------------------------------------------------------------

export const crawlPagesRelations = relations(crawlPages, ({ one, many }) => ({
  crawlJob: one(crawlJobs, {
    fields: [crawlPages.crawlJobId],
    references: [crawlJobs.id],
  }),
  site: one(sites, {
    fields: [crawlPages.siteId],
    references: [sites.id],
  }),
  organization: one(organizations, {
    fields: [crawlPages.organizationId],
    references: [organizations.id],
  }),
  screenshots: many(pageScreenshots),
  faqItems: many(faqItems),
}));

// ---------------------------------------------------------------------------
// pageScreenshots
// ---------------------------------------------------------------------------

export const pageScreenshotsRelations = relations(
  pageScreenshots,
  ({ one, many }) => ({
    crawlPage: one(crawlPages, {
      fields: [pageScreenshots.crawlPageId],
      references: [crawlPages.id],
    }),
    organization: one(organizations, {
      fields: [pageScreenshots.organizationId],
      references: [organizations.id],
    }),
    faqItemScreenshots: many(faqItemScreenshots),
  }),
);

// ---------------------------------------------------------------------------
// faqCategories
// ---------------------------------------------------------------------------

export const faqCategoriesRelations = relations(
  faqCategories,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [faqCategories.organizationId],
      references: [organizations.id],
    }),
    site: one(sites, {
      fields: [faqCategories.siteId],
      references: [sites.id],
    }),
    parent: one(faqCategories, {
      fields: [faqCategories.parentId],
      references: [faqCategories.id],
      relationName: 'category_parent',
    }),
    children: many(faqCategories, {
      relationName: 'category_parent',
    }),
    faqItems: many(faqItems),
  }),
);

// ---------------------------------------------------------------------------
// faqItems
// ---------------------------------------------------------------------------

export const faqItemsRelations = relations(faqItems, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [faqItems.organizationId],
    references: [organizations.id],
  }),
  category: one(faqCategories, {
    fields: [faqItems.categoryId],
    references: [faqCategories.id],
  }),
  site: one(sites, {
    fields: [faqItems.siteId],
    references: [sites.id],
  }),
  sourcePage: one(crawlPages, {
    fields: [faqItems.sourcePageId],
    references: [crawlPages.id],
  }),
  screenshots: many(faqItemScreenshots),
  tags: many(faqItemTags),
  versions: many(faqVersions),
  feedbacks: many(faqFeedbacks),
  relatedItems: many(faqRelatedItems, { relationName: 'faq_item_source' }),
  relatedByItems: many(faqRelatedItems, { relationName: 'faq_item_related' }),
  embeddings: many(faqEmbeddings),
}));

// ---------------------------------------------------------------------------
// faqItemScreenshots
// ---------------------------------------------------------------------------

export const faqItemScreenshotsRelations = relations(
  faqItemScreenshots,
  ({ one }) => ({
    faqItem: one(faqItems, {
      fields: [faqItemScreenshots.faqItemId],
      references: [faqItems.id],
    }),
    screenshot: one(pageScreenshots, {
      fields: [faqItemScreenshots.screenshotId],
      references: [pageScreenshots.id],
    }),
  }),
);

// ---------------------------------------------------------------------------
// faqTags
// ---------------------------------------------------------------------------

export const faqTagsRelations = relations(faqTags, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [faqTags.organizationId],
    references: [organizations.id],
  }),
  faqItemTags: many(faqItemTags),
}));

// ---------------------------------------------------------------------------
// faqItemTags
// ---------------------------------------------------------------------------

export const faqItemTagsRelations = relations(faqItemTags, ({ one }) => ({
  faqItem: one(faqItems, {
    fields: [faqItemTags.faqItemId],
    references: [faqItems.id],
  }),
  tag: one(faqTags, {
    fields: [faqItemTags.tagId],
    references: [faqTags.id],
  }),
}));

// ---------------------------------------------------------------------------
// faqVersions
// ---------------------------------------------------------------------------

export const faqVersionsRelations = relations(faqVersions, ({ one }) => ({
  faqItem: one(faqItems, {
    fields: [faqVersions.faqItemId],
    references: [faqItems.id],
  }),
  changedBy: one(users, {
    fields: [faqVersions.changedBy],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------------
// faqFeedbacks
// ---------------------------------------------------------------------------

export const faqFeedbacksRelations = relations(faqFeedbacks, ({ one }) => ({
  faqItem: one(faqItems, {
    fields: [faqFeedbacks.faqItemId],
    references: [faqItems.id],
  }),
  organization: one(organizations, {
    fields: [faqFeedbacks.organizationId],
    references: [organizations.id],
  }),
}));

// ---------------------------------------------------------------------------
// faqRelatedItems
// ---------------------------------------------------------------------------

export const faqRelatedItemsRelations = relations(
  faqRelatedItems,
  ({ one }) => ({
    faqItem: one(faqItems, {
      fields: [faqRelatedItems.faqItemId],
      references: [faqItems.id],
      relationName: 'faq_item_source',
    }),
    relatedItem: one(faqItems, {
      fields: [faqRelatedItems.relatedItemId],
      references: [faqItems.id],
      relationName: 'faq_item_related',
    }),
  }),
);

// ---------------------------------------------------------------------------
// faqEmbeddings
// ---------------------------------------------------------------------------

export const faqEmbeddingsRelations = relations(faqEmbeddings, ({ one }) => ({
  faqItem: one(faqItems, {
    fields: [faqEmbeddings.faqItemId],
    references: [faqItems.id],
  }),
}));

// ---------------------------------------------------------------------------
// chatbots
// ---------------------------------------------------------------------------

export const chatbotsRelations = relations(chatbots, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [chatbots.organizationId],
    references: [organizations.id],
  }),
  site: one(sites, {
    fields: [chatbots.siteId],
    references: [sites.id],
  }),
  scenarios: many(scenarios),
  chatSessions: many(chatSessions),
}));

// ---------------------------------------------------------------------------
// scenarios
// ---------------------------------------------------------------------------

export const scenariosRelations = relations(scenarios, ({ one, many }) => ({
  chatbot: one(chatbots, {
    fields: [scenarios.chatbotId],
    references: [chatbots.id],
  }),
  organization: one(organizations, {
    fields: [scenarios.organizationId],
    references: [organizations.id],
  }),
  nodes: many(scenarioNodes),
  edges: many(scenarioEdges),
}));

// ---------------------------------------------------------------------------
// scenarioNodes
// ---------------------------------------------------------------------------

export const scenarioNodesRelations = relations(
  scenarioNodes,
  ({ one, many }) => ({
    scenario: one(scenarios, {
      fields: [scenarioNodes.scenarioId],
      references: [scenarios.id],
    }),
    organization: one(organizations, {
      fields: [scenarioNodes.organizationId],
      references: [organizations.id],
    }),
    outgoingEdges: many(scenarioEdges, { relationName: 'edge_from' }),
    incomingEdges: many(scenarioEdges, { relationName: 'edge_to' }),
    chatMessages: many(chatMessages),
  }),
);

// ---------------------------------------------------------------------------
// scenarioEdges
// ---------------------------------------------------------------------------

export const scenarioEdgesRelations = relations(scenarioEdges, ({ one }) => ({
  scenario: one(scenarios, {
    fields: [scenarioEdges.scenarioId],
    references: [scenarios.id],
  }),
  fromNode: one(scenarioNodes, {
    fields: [scenarioEdges.fromNodeId],
    references: [scenarioNodes.id],
    relationName: 'edge_from',
  }),
  toNode: one(scenarioNodes, {
    fields: [scenarioEdges.toNodeId],
    references: [scenarioNodes.id],
    relationName: 'edge_to',
  }),
}));

// ---------------------------------------------------------------------------
// chatSessions
// ---------------------------------------------------------------------------

export const chatSessionsRelations = relations(
  chatSessions,
  ({ one, many }) => ({
    chatbot: one(chatbots, {
      fields: [chatSessions.chatbotId],
      references: [chatbots.id],
    }),
    organization: one(organizations, {
      fields: [chatSessions.organizationId],
      references: [organizations.id],
    }),
    messages: many(chatMessages),
    escalatedInquiries: many(inquiries),
  }),
);

// ---------------------------------------------------------------------------
// chatMessages
// ---------------------------------------------------------------------------

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.id],
  }),
  organization: one(organizations, {
    fields: [chatMessages.organizationId],
    references: [organizations.id],
  }),
  scenarioNode: one(scenarioNodes, {
    fields: [chatMessages.scenarioNodeId],
    references: [scenarioNodes.id],
  }),
}));

// ---------------------------------------------------------------------------
// inquiries
// ---------------------------------------------------------------------------

export const inquiriesRelations = relations(inquiries, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [inquiries.organizationId],
    references: [organizations.id],
  }),
  site: one(sites, {
    fields: [inquiries.siteId],
    references: [sites.id],
  }),
  assignedUser: one(users, {
    fields: [inquiries.assignedTo],
    references: [users.id],
  }),
  escalatedFromSession: one(chatSessions, {
    fields: [inquiries.escalatedFromSession],
    references: [chatSessions.id],
  }),
  aiResponses: many(aiResponses),
}));

// ---------------------------------------------------------------------------
// responseTemplates
// ---------------------------------------------------------------------------

export const responseTemplatesRelations = relations(
  responseTemplates,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [responseTemplates.organizationId],
      references: [organizations.id],
    }),
    createdBy: one(users, {
      fields: [responseTemplates.createdBy],
      references: [users.id],
    }),
    tagAssignments: many(templateTagAssignments),
  }),
);

// ---------------------------------------------------------------------------
// templateTags
// ---------------------------------------------------------------------------

export const templateTagsRelations = relations(
  templateTags,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [templateTags.organizationId],
      references: [organizations.id],
    }),
    tagAssignments: many(templateTagAssignments),
  }),
);

// ---------------------------------------------------------------------------
// templateTagAssignments
// ---------------------------------------------------------------------------

export const templateTagAssignmentsRelations = relations(
  templateTagAssignments,
  ({ one }) => ({
    template: one(responseTemplates, {
      fields: [templateTagAssignments.templateId],
      references: [responseTemplates.id],
    }),
    tag: one(templateTags, {
      fields: [templateTagAssignments.tagId],
      references: [templateTags.id],
    }),
  }),
);

// ---------------------------------------------------------------------------
// aiResponses
// ---------------------------------------------------------------------------

export const aiResponsesRelations = relations(aiResponses, ({ one }) => ({
  inquiry: one(inquiries, {
    fields: [aiResponses.inquiryId],
    references: [inquiries.id],
  }),
  organization: one(organizations, {
    fields: [aiResponses.organizationId],
    references: [organizations.id],
  }),
}));

// ---------------------------------------------------------------------------
// analyticsEvents
// ---------------------------------------------------------------------------

export const analyticsEventsRelations = relations(
  analyticsEvents,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [analyticsEvents.organizationId],
      references: [organizations.id],
    }),
    site: one(sites, {
      fields: [analyticsEvents.siteId],
      references: [sites.id],
    }),
  }),
);

// ---------------------------------------------------------------------------
// usageRecords
// ---------------------------------------------------------------------------

export const usageRecordsRelations = relations(usageRecords, ({ one }) => ({
  organization: one(organizations, {
    fields: [usageRecords.organizationId],
    references: [organizations.id],
  }),
}));

// ---------------------------------------------------------------------------
// llmProviderConfigs
// ---------------------------------------------------------------------------

export const llmProviderConfigsRelations = relations(
  llmProviderConfigs,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [llmProviderConfigs.organizationId],
      references: [organizations.id],
    }),
  }),
);
