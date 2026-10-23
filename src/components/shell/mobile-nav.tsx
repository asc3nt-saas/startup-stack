"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "./sidebar";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-72 border-r bg-sidebar p-4 shadow-xl lg:hidden">
          <Dialog.Title className="sr-only">Navigation</Dialog.Title>
          <Dialog.Close asChild>
            <Button variant="ghost" size="icon" className="absolute right-3 top-3" aria-label="Close menu">
              <X />
            </Button>
          </Dialog.Close>
          <SidebarNav onNavigate={() => setOpen(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
