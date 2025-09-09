import type { Icon } from '@tabler/icons-react';

export interface NavItem {
  title: string;
  url: string;
  icon?: Icon;
  children?: NavItem[];
}

export interface UserProfile {
  name: string;
  email: string;
}

export interface SidebarData {
  navMain: NavItem[];
  admin: NavItem[];
  branch:NavItem[];
  staff:NavItem[];
}

export interface MetricCard {
  title: string;
  value: string;
  description: string;
  trend: {
    type: 'up' | 'down';
    value: string;
  };
  footer: {
    message: string;
    description: string;
  };
}
