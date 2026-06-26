export interface Page {
  pageNumber: number;
  text: string;
}

export interface Document {
  id: string;
  name: string;
  pages: Page[];
  size?: string;
  summary?: string;
  topics?: string[];
  purpose?: string;
  initialSuggestions?: string[];
  isSelected?: boolean;
}

export interface Chunk {
  id: string;
  documentId: string;
  documentName: string;
  pageNumber: number;
  chunkIndex: number;
  text: string;
  tokenCount: number;
}
