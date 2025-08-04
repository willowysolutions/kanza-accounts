import {
  IconBox,
  IconBrandSpeedtest,
  IconBuildingPlus,
  IconCylinder,
  IconDashboard,
  IconFileText,
  IconGasStation,
  IconHelp, IconSearch,
  IconSettings,
  IconSettingsCog,
  IconShoppingBagPlus,
  IconShoppingCart,
  IconUserPlus
} from '@tabler/icons-react';
import type { SidebarData } from '@/types/navigation';
import { APP_CONFIG } from '@/config/app';

export const SIDEBAR_DATA: SidebarData = {
  demoUser: {
    name: 'John Doe',
    email: 'john@company.com',
    avatar: '/avatars/default.jpg',
  },

  // main navigation for all users
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: IconDashboard,
    },
    {
      title: 'Stocks',
      url: '/stocks',
      icon: IconBox,
    },
    {
      title: 'Tank',
      url: '/tanks',
      icon: IconCylinder,
    },
    {
      title: 'Machine',
      url: '/machines',
      icon: IconSettingsCog,
    },
    {
      title: 'Nozzle',
      url: '/nozzles',
      icon: IconGasStation,
    },
    {
      title: 'Sales',
      url: '/sales',
      icon: IconShoppingCart,
    },
    {
      title: 'Purchase',
      url: '/purchase',
      icon: IconShoppingBagPlus,
    },
    {
      title: 'Meter Reading',
      url: '/meter-reading',
      icon: IconBrandSpeedtest,
    },
  ],

  // only admin can see this navigation
  admin: [
    {
      title: 'Reports',
      url: '/admin/reports',
      icon: IconFileText,
    },
    {
      title: 'Branch',
      url: '/admin/branches',
      icon: IconBuildingPlus,
    },
    {
      title: 'Supplier',
      url: '/admin/supplier',
      icon: IconUserPlus,
    }
  ],

  // secondary navigation for all users
  navSecondary: [
    {
      title: 'Settings',
      url: '/settings',
      icon: IconSettings,
    },
    {
      title: 'Search',
      url: '/search',
      icon: IconSearch,
    },
    {
      title: 'Help & Support',
      url: '/help',
      icon: IconHelp,
    },
  ],
};

export const COMPANY_INFO = {
  name: APP_CONFIG.name,
  description: APP_CONFIG.description,
} as const;
