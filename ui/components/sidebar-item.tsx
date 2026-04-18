"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

type Props = {
  label: string;
  iconSrc: string;
  href: string;
  active?: boolean;
};

export const SidebarItem = ({
  label,
  iconSrc,
  href,
  active: activeProp,
}: Props) => {
  const pathname = usePathname();
  const active = activeProp !== undefined 
    ? activeProp 
    : (pathname === href || pathname.startsWith(`${href}/`));

  return (
    <Button
      variant={active ? "sidebarOutline"  : "sidebar"}
      className="justify-start h-[52px]"
      asChild
    >
      <Link href={href}>
        {label}
      </Link>
    </Button>
  );
};
