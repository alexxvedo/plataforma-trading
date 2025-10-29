"use client";
import { FloatingDock } from "@/components/ui/floating-dock";
import {
  IconBrandGithub,
  IconBrandX,
  IconExchange,
  IconHome,
  IconNewSection,
  IconTerminal2,
} from "@tabler/icons-react";


export function FloatingDockComponent() {
    const links = [
      {
        title: "Home",
        icon: (
          <IconHome className="h-full w-full text-neutral-500 dark:text-neutral-300" />
        ),
        href: "/dashboard",
      },
   
      {
        title: "Accounts",
        icon: (
          <IconTerminal2 className="h-full w-full text-neutral-500 dark:text-neutral-300" />
        ),
        href: "/dashboard/accounts",
      },
      {
        title: "Components",
        icon: (
          <IconNewSection className="h-full w-full text-neutral-500 dark:text-neutral-300" />
        ),
        href: "#",
      },
      {
        title: "Aceternity UI",
        icon: (
          <img
            src="https://assets.aceternity.com/logo-dark.png"
            width={20}
            height={20}
            alt="Aceternity Logo"
          />
        ),
        href: "#",
      },
      {
        title: "Changelog",
        icon: (
          <IconExchange className="h-full w-full text-neutral-500 dark:text-neutral-300" />
        ),
        href: "#",
      },
   
      {
        title: "Twitter",
        icon: (
          <IconBrandX className="h-full w-full text-neutral-500 dark:text-neutral-300" />
        ),
        href: "#",
      },
      {
        title: "GitHub",
        icon: (
          <IconBrandGithub className="h-full w-full text-neutral-500 dark:text-neutral-300" />
        ),
        href: "#",
      },
    ];
    return (
      <div className="fixed bottom-0 left-[50%] translate-x-[-50%]">
        <FloatingDock
          items={links}
        />
      </div>
    );
  }