import {
  IconBox,
  IconBrandProducthunt,
  IconBrandSpeedtest,
  IconBuildingBank,
  IconBuildingPlus,
  IconCash,
  IconCashBanknote,
  IconCategory,
  IconCreditCard,
  IconCreditCardPay,
  IconCurrency,
  IconCylinder,
  IconDashboard,
  IconFileText,
  IconGasStation,
  IconSettingsCog,
  IconShoppingBagPlus,
  IconShoppingCart,
  IconUser,
  IconUserPlus
} from '@tabler/icons-react';
import type { SidebarData } from '@/types/navigation';
import { APP_CONFIG } from '@/config/app';

export const SIDEBAR_DATA: SidebarData = {
  // main navigation for all users
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: IconDashboard,
    },
    {
      title: 'Meter Reading',
      url: '/meter-reading',
      icon: IconBrandSpeedtest,
    },
    {
      title: 'Sales',
      url: '/sales',
      icon: IconShoppingCart,
    },
    {
      title: "Expenses",
      url: "/expenses",
      icon: IconCurrency,
    },
    {
      title: 'Credits',
      url: '/credits',
      icon: IconCreditCardPay,
    },
    {
      title: 'Deposit Bank',
      url: '/bankdeposites',
      icon: IconCreditCard,
    },
    {
      title: 'Payments',
      url: '/payments',
      icon: IconCash,
    },
    {
      title: 'Stocks',
      url: '/stocks',
      icon: IconBox,
    },
     {
      title: 'Purchase',
      url: '/purchase',
      icon: IconShoppingBagPlus,
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
      title: 'Balance Receipt',
      url: '/balance-receipt',
      icon: IconCashBanknote,
    }, 
  ],

  // only admin can see this navigation
  admin: [
    {
      title: 'Products',
      url: '/admin/products',
      icon: IconBrandProducthunt
    },
    {
      title: "Reports",
      url: "/admin/reports",
      icon: IconFileText,
      children: [
        {
          title: "Sales Report",
          url: "/reports/sales-reports",
        },
        {
          title: "Purchase Report",
          url: "/reports/purchase-reports",
        },
        {
          title: "Payment Report",
          url: "/reports/payment-reports",
        },
        {
          title: "Customer Report",
          url: "/reports/customer-reports",
        },
        {
          title: "Supplier Report",
          url: "/reports/supplier-reports",
        },
        {
          title: "Report",
          url: "/reports/general-reports",
        },
      ],
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: IconUserPlus,
    },
    {
      title: 'Branch',
      url: '/admin/branches',
      icon: IconBuildingPlus,
    }
  ],

  // only branch can see this navigation
  branch: [
    {
      title: 'Branch',
      url: '/branch/staffs',
      icon: IconUserPlus,
    },
    {
      title: 'Bank',
      url: '/branch/banks',
      icon: IconBuildingBank,
    },
    
    {
      title: 'Supplier',
      url: '/branch/suppliers',
      icon: IconUserPlus,
    },
    {
      title: 'Customer',
      url: '/branch/customers',
      icon: IconUser,
    },
    {
      title: 'Expense Category',
      url: '/branch/expensescategory',
      icon: IconCategory,
    }
  ],

  staff: [
    {
      title: 'Meter Reading',
      url: 'staff/meter-reading',
      icon: IconBrandSpeedtest,
    }
  ],

  // secondary navigation for all users
  // navSecondary: [
  //   {
  //     title: 'Settings',
  //     url: '/settings',
  //     icon: IconSettings,
  //   },
  //   {
  //     title: 'Search',
  //     url: '/search',
  //     icon: IconSearch,
  //   },
  //   {
  //     title: 'Help & Support',
  //     url: '/help',
  //     icon: IconHelp,
  //   },
  // ],
};

export const COMPANY_INFO = {
  name: APP_CONFIG.name,
  description: APP_CONFIG.description,
} as const;
