export type Category = {
  id: number;
  name: string;
  sortOrder: number;
};

export type Service = {
  id: number;
  name: string;
  description: string;
  url: string;
  icon: string;
  favorite: boolean;
  adminOnly: boolean;
  sortOrder: number;
  categoryId: number;
  category: Category;
};

export type Settings = {
  id: number;
  title: string;
  logoUrl: string | null;
  accentColor: string;
  darkMode: boolean;
  showServerAddress: boolean;
  serverAddress: string;
};
