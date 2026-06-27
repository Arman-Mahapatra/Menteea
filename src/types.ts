export interface DocumentPage {
  pageNumber: number;
  text: string;
}

export interface DocumentFile {
  id: string;
  name: string;
  pages: DocumentPage[];
  summary?: string;
  topics?: string[];
  purpose?: string;
  initialSuggestions?: string[];
  summaryError?: string;
  uploadTime: string;
  isSelected: boolean;
  size?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  suggestions?: string[];
  isInitialSummary?: boolean;
}

export interface AppState {
  apiKey: string;
  documents: DocumentFile[];
  activeChatId: string | null;
  messages: ChatMessage[];
  selectedDocumentIdForViewer: string | null;
  viewerPageNumber: number;
  isLoading: boolean;
  loadingStatus: string;
}