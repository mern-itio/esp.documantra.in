export type ApiType = {
  name: string;
  endpoint: string;
  method: string;
  showFile: boolean;
  showBody: boolean;
  showEnvelopeId: boolean;
  showDocumentId?: boolean;
  bodyTemplate: string;
  description: string;
}
