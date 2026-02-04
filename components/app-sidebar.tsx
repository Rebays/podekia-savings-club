"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, LogOut, LayoutDashboard, BookOpen, User, Settings, Group } from "lucide-react"
import { cn } from "@/lib/utils"
import { signOut, supabaseBrowser } from "@/lib/supabse/client" // your browser client
import Image from "next/image"

const navItems = [
  {
    title: "Overview",
    href: "/dashboard/admin",
    icon: LayoutDashboard,
    adminOnly: true,
  },
  {
    title: "My savings",
    href: "/dashboard",
    icon: User,
  },
  
  {
    title: "Contributions",
    href: "/admin/contributions-overview",
    icon: BookOpen,
    adminOnly: true,
  },
  {
    title: "Members",
    href: "/admin/members",
    icon: Group,
    adminOnly: true,
  }
  // Add more items later (e.g. Profile, Settings)
]

export function AppSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabaseBrowser.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [])

  const handleSignOut = async () => {
    await signOut()
    window.location.href = "/login"
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Image
            src="/podekia-logo.png"
            alt="Podekia Savings Club Logo"
            width={60}
            height={60}
          />
          
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Podekia Club</h2>
            <p className="text-xs text-muted-foreground">Member Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-muted/70 text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
              onClick={() => setOpen(false)}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start px-3 py-6 h-auto">
              <Avatar className="h-9 w-9 mr-3">
                <AvatarFallback className="bg-linear-to-br from-cyan-500/20 to-purple-600/20 text-cyan-400">
                  {user?.email?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left">
                <span className="font-medium text-sm truncate max-w-35">
                  {user?.email?.split("@")[0]}
                </span>
                <span className="text-xs text-muted-foreground">Member</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {/* <DropdownMenuLabel>My Account</DropdownMenuLabel> */}
            {/* <DropdownMenuSeparator /> */}
            <DropdownMenuItem onClick={handleSignOut} className="text-red-400 focus:text-red-400">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-30 w-72 border-r border-border/50 bg-card/80 backdrop-blur-md">
        <SidebarContent />
      </div>

      {/* Mobile sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="lg:hidden fixed top-4 left-4 z-50">
          <Button variant="ghost" size="icon" className="bg-card/80 backdrop-blur-sm border border-border/50">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 bg-card/95 backdrop-blur-lg border-r border-border/50">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  )
}