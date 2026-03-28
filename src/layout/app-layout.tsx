import AppSidebar from '@/components/app-sidebar'
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import type { BreadcrumbItem } from '@/types';
import { Outlet } from 'react-router-dom'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

const AppLayout = () => {

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="border-sidebar-border/50 flex h-16 shrink-0 items-center gap-2 border-b px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </header>
                {<Outlet />}
            </SidebarInset>
        </SidebarProvider>
    )
}

export default AppLayout    