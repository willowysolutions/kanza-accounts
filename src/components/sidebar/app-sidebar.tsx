"use client";

import * as React from "react";
import Link from "next/link";
import { IconInnerShadowTop } from "@tabler/icons-react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SIDEBAR_DATA, COMPANY_INFO } from "@/constants/navigation";
import { UserProfile } from "@/types/user";
import { NavGroup } from "./nav-group";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: UserProfile;
}

export function AppSidebar({ user,...props }: AppSidebarProps) {

  const filteredNavMain = SIDEBAR_DATA.navMain.filter(
  () => user?.role?.toLowerCase() !== "staff");
  
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="bg-secondary text-secondary-foreground">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">
                  {COMPANY_INFO.name}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="bg-primary text-primary-foreground">
        <NavMain items={filteredNavMain}/>
        {user?.role === "admin" && (
          <NavGroup label="Admin Area" items={SIDEBAR_DATA.admin} />
        )}
        {user?.role === "branch" && (
          <NavGroup label="Branch Area" items={SIDEBAR_DATA.branch} />
        )}
        {user?.role === "staff" && (
          <NavGroup label="Staff Area" items={SIDEBAR_DATA.staff} />
        )}
        {/* <NavSecondary items={SIDEBAR_DATA.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter className="bg-sidebar-primary text-primary-foreground">{user && <NavUser user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
