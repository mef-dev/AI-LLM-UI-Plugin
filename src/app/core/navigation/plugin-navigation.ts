export type PluginNavigationItem = {
  path: string;
  label: string;
  hint: string;
};

export const PLUGIN_NAVIGATION_ITEMS: PluginNavigationItem[] = [
  { path: 'chat', label: 'chat', hint: 'Conversation loop and assistant responses.' },
  { path: 'llm-db', label: 'llm-db', hint: 'Storage and retrieval around model data.' },
  { path: 'document', label: 'document', hint: 'Upload, parse, and inspect document flows.' },
  { path: 'embeddings', label: 'embeddings', hint: 'Turn text into vectors for semantic use.' },
  { path: 'llm', label: 'llm', hint: 'Model capabilities, prompts, and outputs.' },
  { path: 'vector', label: 'vector', hint: 'Similarity search and nearest-neighbor results.' }
];
