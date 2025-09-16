import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { NavItem } from "@/types/navigation";
import Link from "next/link";

interface NavMenuProps {
  items: NavItem[];
}

export const NavMenu = ({ items, ...rest }: NavMenuProps) => (
  <SidebarMenu {...rest}>
    {items.map((item) =>
      item.children ? (
        <SubMenu key={item.title} item={item} />
      ) : (
        <SidebarMenuItem key={item.url}>
          <SidebarMenuButton asChild className="text-primary-foreground hover:text-black">
            <Link href={item.url}>
              {item.icon && <item.icon />}
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ),
    )}
  </SidebarMenu>
);

const SubMenu = ({ item }: { item: NavItem }) => (
  <Collapsible key={item.title} className="group/collapsible">
    <SidebarMenuItem>
      <CollapsibleTrigger asChild>
        <SidebarMenuButton className="text-primary-foreground hover:text-black">
          {item.icon && <item.icon />}
          <span>{item.title}</span>
          <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
        </SidebarMenuButton>
      </CollapsibleTrigger>
    </SidebarMenuItem>

    <CollapsibleContent>
      <SidebarMenuSub>
        {item.children!.map((subItem) =>
          subItem.children ? (
            <SidebarMenuSubItem key={subItem.url}>
              <SubMenu item={subItem} />
            </SidebarMenuSubItem>
          ) : (
            <SidebarMenuSubItem key={subItem.url}>
              <SidebarMenuSubButton asChild className="text-primary-foreground hover:text-black">
                <Link href={subItem.url}>
                  {subItem.icon && <subItem.icon />}
                  <span>{subItem.title}</span>
                </Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ),
        )}
      </SidebarMenuSub>
    </CollapsibleContent>
  </Collapsible>
);
