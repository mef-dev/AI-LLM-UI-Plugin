export type PluginNavigationItem = {
  path: string;
  label: string;
  hint: string;
};

export const PLUGIN_NAVIGATION_ITEMS: PluginNavigationItem[] = [
  { path: 'llm', label: 'Models', hint: 'Register, validate, and manage available LLMs.' },
  { path: 'chat', label: 'Chat', hint: 'Test prompts and review assistant responses.' },
  { path: 'responses', label: 'Responses', hint: 'Use the structured responses API with reasoning controls.' },
  { path: 'document', label: 'Documents', hint: 'Upload and inspect knowledge sources.' },
  { path: 'embeddings', label: 'Embeddings', hint: 'Work with text vector generation flows.' },
  { path: 'vector', label: 'Vector Search', hint: 'Explore retrieval and similarity search tools.' }
];
