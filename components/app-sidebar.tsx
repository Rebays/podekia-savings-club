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
import {
  Menu,
  LogOut,
  LayoutDashboard,
  Wallet,
  BookOpen,
  DollarSign,
  Users,
  Clock,
  UploadCloud,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { supabaseBrowser } from "@/lib/supabse/client" // fixed path
import Image from "next/image"

// Define the type for nav items so adminOnly is allowed
interface NavItem {
  title: string
  href: string
  icon: any // or import { LucideIcon } from "lucide-react" and use LucideIcon
  adminOnly?: boolean
}

interface NavGroup {
  title: string
  items: NavItem[]
  adminOnly?: boolean
}

const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
    ],
  },
  {
    title: "My Finances",
    items: [
      { title: "My Savings", href: "/dashboard", icon: Wallet },
      // { title: "My Settlements", href: "/dashboard/settlements", icon: DollarSign },
    ],
  },
  {
    title: "Club Records",
    items: [
      { title: "Contributions", href: "/admin/contributions-overview", icon: BookOpen, adminOnly: false },
       { title: "Settlements", href: "/dashboard/admin/settlements", icon: DollarSign, adminOnly: true },
      { title: "Contribution Sheets", href: "/dashboard/admin/contribution-sheets", icon: UploadCloud, adminOnly: true },
    ],
    adminOnly: false,
  },
  {
    title: "Members & Attendance",
    items: [
      { title: "Members", href: "/admin/members", icon: Users, adminOnly: true },
      // { title: "Attendance", href: "/dashboard/admin/attendance", icon: Clock, adminOnly: true },
    ],
    adminOnly: false,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabaseBrowser.auth.getUser().then(({ data }) => {
      setUser(data.user)
      // Real role check (recommended)
      if (data.user) {
        supabaseBrowser
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()
          .then(({ data: profile }) => {
            setIsAdmin(profile?.role === 'admin')
          })
      }
    })
  }, [])

  const handleSignOut = async () => {
    await supabaseBrowser.auth.signOut()
    window.location.href = "/login"
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
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

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-6 space-y-6 overflow-y-auto">
        {navGroups.map((group) => {
          if (group.adminOnly && !isAdmin) return null

          return (
            <div key={group.title} className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.title}
              </h3>
              {group.items.map((item) => {
                if (item.adminOnly && !isAdmin) return null

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
            </div>
          )
        })}
      </nav>

      {/* User Dropdown */}
      <div className="p-4 border-t border-border/50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start px-3 py-6 h-auto">
              <Avatar className="h-9 w-9 mr-3">
                <AvatarFallback className="bg-gradient-to-br from-cyan-500/20 to-purple-600/20 text-cyan-400">
                  {user?.email?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left">
                <span className="font-medium text-sm truncate max-w-[140px]">
                  {user?.email?.split("@")[0] || "User"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {isAdmin ? "Admin" : "Member"}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
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