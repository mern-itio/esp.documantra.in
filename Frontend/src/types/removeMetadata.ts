export interface RemoveMetadataRequest {
  file: File;
  removeDocumentInfo?: boolean;
  removeProducer?: boolean;
  removeCreator?: boolean;
  removeCreationDate?: boolean;
  removeModificationDate?: boolean;
  removeKeywords?: boolean;
  removeSubject?: boolean;
  removeAuthor?: boolean;
  removeTitle?: boolean;
  removeTrapped?: boolean;
  removePageLabels?: boolean;
  removeBookmarks?: boolean;
  removeAnnotations?: boolean;
  removeFormFields?: boolean;
  removeJavaScript?: boolean;
  removeEmbeddedFiles?: boolean;
  removeXMPMetadata?: boolean;
  removeICCProfiles?: boolean;
  removeColorProfiles?: boolean;
  removeOutputIntents?: boolean;
  removePageLayout?: boolean;
  removePageMode?: boolean;
  removeViewerPreferences?: boolean;
  removeOpenAction?: boolean;
  removeAdditionalStreams?: boolean;
  removeStructureTree?: boolean;
  removeMarkInfo?: boolean;
  removeLang?: boolean;
  removeSpiderInfo?: boolean;
  removeCollection?: boolean;
  removeNeedsRendering?: boolean;
  removePieceInfo?: boolean;
  removeOCProperties?: boolean;
  removeDSS?: boolean;
  removeAF?: boolean;
  removeDests?: boolean;
  removeNames?: boolean;
  removeID?: boolean;
  removeEncrypt?: boolean;
  removeMetadata?: boolean;
  removeStructTreeRoot?: boolean;
  removeCatalog?: boolean;
  removeInfo?: boolean;
  removeXRef?: boolean;
  removeTrailer?: boolean;
  removeRoot?: boolean;
  removePages?: boolean;
  removeKids?: boolean;
  removeParent?: boolean;
  removeMediaBox?: boolean;
  removeCropBox?: boolean;
  removeBleedBox?: boolean;
  removeTrimBox?: boolean;
  removeArtBox?: boolean;
  removeRotate?: boolean;
  removeResources?: boolean;
  removeContents?: boolean;
  removeFonts?: boolean;
  removeImages?: boolean;
  removeShadings?: boolean;
  removePatterns?: boolean;
  removeXObjects?: boolean;
  removeExtGState?: boolean;
  removeProperties?: boolean;
  removeShading?: boolean;
  removePattern?: boolean;
  removeFont?: boolean;
  removeImage?: boolean;
  removeXObject?: boolean;
}

export interface RemoveMetadataResponse {
  success: boolean;
  message: string;
  filename: string;
  downloadUrl: string;
  totalPages: number;
  fileSize: number;
  originalFileSize: number;
  sizeReduction: number;
  metadataInfo: {
    originalMetadata?: string;
    cleanedMetadata?: string;
  };
  cleaningOptions: {
    removeDocumentInfo?: boolean;
    removeProducer?: boolean;
    removeCreator?: boolean;
    removeCreationDate?: boolean;
    removeModificationDate?: boolean;
    removeKeywords?: boolean;
    removeSubject?: boolean;
    removeAuthor?: boolean;
    removeTitle?: boolean;
    removeTrapped?: boolean;
    removeXMPMetadata?: boolean;
    removeMetadata?: boolean;
  };
}

export interface MetadataCheckResponse {
  metadataFound: boolean;
  metadataInfo: {
    qpdfInfo?: string;
    exifInfo?: string;
    pdfInfo?: string;
  };
  message: string;
}

export interface MetadataCleaningPreset {
  id: string;
  name: string;
  description: string;
  options: Partial<RemoveMetadataRequest>;
  icon: string;
  category: 'basic' | 'advanced' | 'comprehensive' | 'custom';
}

export interface MetadataCleaningOptions {
  basic: {
    removeDocumentInfo: boolean;
    removeProducer: boolean;
    removeCreator: boolean;
    removeCreationDate: boolean;
    removeModificationDate: boolean;
    removeKeywords: boolean;
    removeSubject: boolean;
    removeAuthor: boolean;
    removeTitle: boolean;
    removeTrapped: boolean;
  };
  advanced: {
    removeXMPMetadata: boolean;
    removeICCProfiles: boolean;
    removeColorProfiles: boolean;
    removeOutputIntents: boolean;
    removePageLayout: boolean;
    removePageMode: boolean;
    removeViewerPreferences: boolean;
    removeOpenAction: boolean;
  };
  comprehensive: {
    removeAdditionalStreams: boolean;
    removeStructureTree: boolean;
    removeMarkInfo: boolean;
    removeLang: boolean;
    removeSpiderInfo: boolean;
    removeCollection: boolean;
    removeNeedsRendering: boolean;
    removePieceInfo: boolean;
    removeOCProperties: boolean;
    removeDSS: boolean;
    removeAF: boolean;
    removeDests: boolean;
    removeNames: boolean;
    removeID: boolean;
    removeEncrypt: boolean;
    removeStructTreeRoot: boolean;
    removeCatalog: boolean;
    removeInfo: boolean;
    removeXRef: boolean;
    removeTrailer: boolean;
    removeRoot: boolean;
  };
  content: {
    removePages: boolean;
    removeKids: boolean;
    removeParent: boolean;
    removeMediaBox: boolean;
    removeCropBox: boolean;
    removeBleedBox: boolean;
    removeTrimBox: boolean;
    removeArtBox: boolean;
    removeRotate: boolean;
    removeResources: boolean;
    removeContents: boolean;
    removeFonts: boolean;
    removeImages: boolean;
    removeShadings: boolean;
    removePatterns: boolean;
    removeXObjects: boolean;
    removeExtGState: boolean;
    removeProperties: boolean;
    removeShading: boolean;
    removePattern: boolean;
    removeFont: boolean;
    removeImage: boolean;
    removeXObject: boolean;
  };
}
