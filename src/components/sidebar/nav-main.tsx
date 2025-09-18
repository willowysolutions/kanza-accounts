'use client';

import { IconCirclePlusFilled } from '@tabler/icons-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types/navigation';
import { navigation } from '@/config/app';
import { NavMenu } from './nav-menu';

interface NavMainProps {
  items: NavItem[];
}

export function NavMain({ items }: NavMainProps) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {navigation.showQuickCreate && (
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              <SidebarMenuButton
                tooltip="Quick Create"
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
              >
                <IconCirclePlusFilled />
                <span>Quick Create</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}

        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url;
            if (item.children && item.children.length > 0) {
              return (
                <SidebarMenuItem key={item.title} className="px-0">
                  <NavMenu items={[item]} />
                </SidebarMenuItem>
              );
            }
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  asChild
                  className={`relative flex items-center gap-2 rounded-md px-3 py-2 transition-colors
                    ${isActive ? 'bg-muted font-semibold text-primary' : 'hover:bg-muted/50'}
                  `}
                >
                  <Link href={item.url}>
                    {item.icon && <item.icon />}
                    <span >{item.title}</span>
                  </Link>
                </SidebarMenuButton>

                {isActive && (
                  <span className="absolute left-0 top-0 h-full w-1 bg-primary rounded-r-md" />
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
