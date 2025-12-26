const { z } = require('zod');

// Recipient schema
const RecipientSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  authMethods: z.array(z.string()).optional()
});

// Signature field schema
const SignatureFieldSchema = z.object({
  type: z.enum(['signature', 'name', 'date', 'text', 'initial']),
  page: z.number().int().positive().default(1),
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().default(150),
  height: z.number().default(40),
  position: z.enum(['bottom-right', 'bottom-left', 'top-right', 'top-left', 'center']).optional(),
  recipientEmail: z.string().email().optional(),
  documentIndex: z.number().int().positive().optional()
});

// Search document parameters
const SearchDocumentParamsSchema = z.object({
  query: z.string().optional(),
  recipientName: z.string().nullable().optional(),
  recipientEmail: z.string().email().nullable().optional(),
  documentTitle: z.string().nullable().optional(),
  keywords: z.array(z.string()).optional(),
  category: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  folderId: z.string().nullable().optional(),
  dateFrom: z.string().nullable().optional(),
  dateTo: z.string().nullable().optional()
});

// Send document parameters
const SendDocumentParamsSchema = z.object({
  documentId: z.string().nullable(),
  recipients: z.array(RecipientSchema),
  subject: z.string().optional(),
  category: z.string().nullable().optional(),
  message: z.string().nullable().optional()
});

// Prepare document parameters
const PrepareDocumentParamsSchema = z.object({
  documentId: z.string(),
  fields: z.array(z.object({
    type: z.enum(['signature', 'name', 'date', 'text', 'initial']),
    page: z.number().int().positive(),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    recipientId: z.string().nullable().optional()
  }))
});

// Create and send envelope parameters
const CreateAndSendEnvelopeParamsSchema = z.object({
  documentId: z.string().nullable(),
  recipients: z.array(RecipientSchema),
  signatureFields: z.array(SignatureFieldSchema),
  subject: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  isScheduled: z.boolean().optional(),
  scheduledDate: z.string().nullable().optional(), // ISO date string or date with time
  scheduledTime: z.string().nullable().optional() // Time string (e.g., "14:30")
});

// Generate document parameters
const GenerateDocumentParamsSchema = z.object({
  category: z.string(),
  requirements: z.string().optional(),
  formData: z.record(z.any()).optional(),
  recipientEmail: z.string().email().optional() // Optional: if provided, document will be auto-sent after generation
});

// List documents by category parameters
const ListDocumentsByCategoryParamsSchema = z.object({
  category: z.string(),
  limit: z.number().int().positive().default(20)
});

// List shared documents parameters
const ListSharedDocumentsParamsSchema = z.object({
  recipientEmail: z.string().email().optional().nullable(), // Optional: if not provided, returns documents shared BY current user
  date: z.string().optional().nullable(), // Optional: filter by date (e.g., "today", "yesterday", "YYYY-MM-DD")
  serviceType: z.string().optional().nullable(), // Optional: filter by service type ("e-sign", "document", or undefined for both)
  status: z.string().optional().nullable(), // Optional: filter by status ("draft", "sent", "completed", etc.). If "draft", includes drafts; otherwise excludes drafts
  limit: z.number().int().positive().default(20)
});

// List signed documents parameters
const ListSignedDocumentsParamsSchema = z.object({
  recipientEmail: z.string().email(),
  date: z.string(),
  limit: z.number().int().positive().default(20)
});

// Select document parameters
const SelectDocumentParamsSchema = z.object({
  documentIndex: z.number().int().positive(),
  previousAction: z.string().optional()
});

// Action type enum
const ActionTypeSchema = z.enum([
  'search_document',
  'send_document',
  'prepare_document',
  'create_and_send_envelope',
  'list_auth_providers',
  'generate_document',
  'list_documents_by_category',
  'list_shared_documents',
  'list_signed_documents',
  'select_document'
]);

// Main action response schema
const ActionResponseSchema = z.object({
  action: ActionTypeSchema.nullable(),
  parameters: z.union([
    SearchDocumentParamsSchema,
    SendDocumentParamsSchema,
    PrepareDocumentParamsSchema,
    CreateAndSendEnvelopeParamsSchema,
    z.object({}), // list_auth_providers
    GenerateDocumentParamsSchema,
    ListDocumentsByCategoryParamsSchema,
    ListSharedDocumentsParamsSchema,
    ListSignedDocumentsParamsSchema,
    SelectDocumentParamsSchema
  ]),
  clarification: z.string().nullable()
});

module.exports = {
  ActionResponseSchema,
  SearchDocumentParamsSchema,
  SendDocumentParamsSchema,
  PrepareDocumentParamsSchema,
  CreateAndSendEnvelopeParamsSchema,
  GenerateDocumentParamsSchema,
  ListDocumentsByCategoryParamsSchema,
  ListSharedDocumentsParamsSchema,
  ListSignedDocumentsParamsSchema,
  SelectDocumentParamsSchema,
  RecipientSchema,
  SignatureFieldSchema
};

