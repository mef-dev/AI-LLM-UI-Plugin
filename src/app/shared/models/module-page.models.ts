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
  eyebrow?: string;
  badgeLabel?: string;
  badgeTone?: 'neutral' | 'success' | 'warning';
  subtitle: string;
  purpose?: string;
  overviewTitle?: string;
  actionsTitle?: string;
  sections: ModuleSection[];
  actions: ModuleAction[];
};
