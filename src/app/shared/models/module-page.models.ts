export type ModuleSection = {
  title: string;
  text: string;
};

export type ModuleAction = {
  label: string;
  description: string;
};

export type ModulePageConfig = {
  name: string;
  subtitle: string;
  purpose: string;
  sections: ModuleSection[];
  actions: ModuleAction[];
};
