import { Crop, Home, User, LogOut } from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
} from "@/components/ui/sidebar"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/auth-context"

const items = [
    {
        title: "Home",
        url: "/home",
        icon: Home,
    },
    {
        title: "Profile",
        url: "/profile",
        icon: User,
    },
]

const AppSidebar = () => {
    const { user, signOut } = useAuth()
    const navigate = useNavigate()

    const handleSignOut = () => {
        signOut()
        navigate("/sign-in")
    }

    return (
        <Sidebar>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link to="/">
                                <div className="">
                                    <Crop className="h-20 w-20" />
                                </div>
                                <div>
                                    <span>Expense Tracker</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Application</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <Link to={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        {user && (
                            <div className="px-2 py-1.5 text-sm">
                                <p className="font-medium truncate">{user.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                        )}
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleSignOut} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <LogOut />
                            <span>Sign out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}

export default AppSidebar


