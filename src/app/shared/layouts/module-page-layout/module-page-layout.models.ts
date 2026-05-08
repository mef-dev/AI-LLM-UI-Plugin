export type ModulePageSection = {
  title: string;
  text: string;
};

export type ModulePageAction = {
  label: string;
  description: string;
};

export type ModulePageLayoutConfig = {
  name: string;
  eyebrow?: string;
  badgeLabel?: string;
  badgeTone?: 'neutral' | 'success' | 'warning';
  subtitle: string;
  purpose?: string;
  overviewTitle?: string;
  actionsTitle?: string;
  sections: ModulePageSection[];
  actions: ModulePageAction[];
};
