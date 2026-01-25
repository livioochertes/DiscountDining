import { Link, useLocation } from "wouter";
import { Users, Store, Settings, ShoppingCart, Award, CreditCard, BarChart3, UserCheck, Building2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface SectionNavigationProps {
  currentSection: "users" | "restaurants" | "admin";
  onTabChange?: (tab: string) => void;
  activeTab?: string;
}

export function SectionNavigation({ currentSection, onTabChange, activeTab }: SectionNavigationProps) {
  const [location] = useLocation();
  const { t } = useLanguage();

  // Fallback translations for when context is loading
  const fallback = {
    sectionNavigation: {
      users: 'Users',
      usersDesc: 'Customer Dashboard',
      restaurants: 'Restaurants', 
      restaurantsDesc: 'Restaurant Management',
      admin: 'Admin',
      adminDesc: 'Platform Administration',
      dashboard: 'Dashboard',
      voucherPackages: 'Voucher Packages',
      adminDashboard: 'Admin Dashboard',
      restaurantMgmt: 'Restaurant Management',
      userMgmt: 'User Management',
      financialMgmt: 'Financial Management',
      platformSettings: 'Platform Settings',
      menuManagement: 'Menu Management',
      orderHistory: 'Order History',
      finances: 'Finances'
    },
    dashboard: 'Dashboard',
    orders: 'Orders',
    myVouchers: 'My Vouchers',
    pointsRewards: 'Points & Rewards',
    profile: 'Profile'
  };

  // Use translations or fallback
  const trans = t?.sectionNavigation ? t : fallback;

  const sections = [
    {
      id: "users" as const,
      title: trans.sectionNavigation?.users || "Users",
      icon: Users,
      description: trans.sectionNavigation?.usersDesc || "Customer dashboard",
      links: [
        { href: "/dashboard", label: trans.dashboard || "Dashboard", icon: BarChart3 },
        { href: "/my-orders", label: trans.orders || "Orders", icon: ShoppingCart },
        { href: "/my-vouchers", label: trans.myVouchers || "My Vouchers", icon: Award },
        { href: "/points", label: trans.pointsRewards || "Points & Rewards", icon: CreditCard },
        { href: "/profile", label: trans.profile || "Profile", icon: UserCheck },
      ]
    },
    {
      id: "restaurants" as const,
      title: trans.sectionNavigation?.restaurants || "Restaurants",
      icon: Store,
      description: trans.sectionNavigation?.restaurantsDesc || "Restaurant Management",
      links: [
        { href: "/restaurant-portal", label: trans.sectionNavigation?.dashboard || "Dashboard", icon: BarChart3 },
        { href: "/restaurant-portal/packages", label: trans.sectionNavigation?.voucherPackages || "Voucher Packages", icon: Award },
        { href: "/restaurant-portal/menu", label: trans.sectionNavigation?.menuManagement || "Menu Management", icon: Store },
        { href: "/restaurant-portal/orders", label: trans.sectionNavigation?.orderHistory || "Order History", icon: ShoppingCart },
        { href: "/restaurant-portal/finances", label: trans.sectionNavigation?.finances || "Finances", icon: CreditCard },
      ]
    },
    {
      id: "admin" as const,
      title: trans.sectionNavigation?.admin || "Admin",
      icon: Settings,
      description: trans.sectionNavigation?.adminDesc || "Platform Administration",
      links: [
        { href: "/admin", label: trans.sectionNavigation?.adminDashboard || "Admin Dashboard", icon: BarChart3, tab: "overview" },
        { href: "/admin", label: "EatOff Vouchers", icon: Award, tab: "eatoff-vouchers" },
        { href: "/admin", label: trans.sectionNavigation?.restaurantMgmt || "Restaurant Management", icon: Store, tab: "restaurants" },
        { href: "/admin", label: "Partners Admin", icon: Building2, tab: "partners" },
        { href: "/admin", label: trans.sectionNavigation?.userMgmt || "User Management", icon: Users, tab: "users" },
        { href: "/admin", label: trans.sectionNavigation?.financialMgmt || "Financial Management", icon: CreditCard, tab: "finances" },
        { href: "/admin", label: trans.sectionNavigation?.platformSettings || "Platform Settings", icon: Settings, tab: "settings" },
      ]
    }
  ];

  const currentSectionData = sections.find(s => s.id === currentSection);
  if (!currentSectionData) return null;

  return (
    <TooltipProvider disableHoverableContent={false} delayDuration={300} skipDelayDuration={100}>
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <currentSectionData.icon className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentSectionData.title}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentSectionData.description}
                </p>
              </div>
            </div>
            
            {/* Section Switcher - only show for non-admin sections */}
            {currentSection !== "admin" && (
              <div className="flex items-center space-x-2">
              {sections.map((section) => (
                <Tooltip key={section.id}>
                  <TooltipTrigger asChild>
                    <Link
                      href={section.links[0].href}
                      className={`
                        flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                        ${currentSection === section.id
                          ? "bg-primary text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }
                      `}
                    >
                      <section.icon className="h-4 w-4" />
                      <span>{section.title}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="top" 
                    className="radix-tooltip-override"
                    sideOffset={12}
                    avoidCollisions={false}
                    align="center"
                  >
                    {section.description}
                  </TooltipContent>
                </Tooltip>
              ))}
              </div>
            )}
          </div>
          
          {/* Right side - keep empty or add other controls */}
          <div className="flex items-center">
          </div>
        </div>
        
        {/* Section Navigation - moved to second row */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-3 pb-1">
          <nav className="flex space-x-6 overflow-x-auto">
          {currentSectionData.links.map((link) => {
            // For admin section, use tab-based activation
            const linkWithTab = link as typeof link & { tab?: string };
            const isActive = currentSection === "admin" 
              ? activeTab === linkWithTab.tab 
              : location === link.href || (link.href !== "/" && location.startsWith(link.href));
            
            const handleClick = (e: React.MouseEvent) => {
              if (currentSection === "admin" && onTabChange && linkWithTab.tab) {
                e.preventDefault();
                onTabChange(linkWithTab.tab);
              }
            };
            
            return (
              <Link
                key={linkWithTab.tab || link.href}
                href={link.href}
                onClick={handleClick}
                className={`
                  flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors
                  ${isActive
                    ? "bg-primary/10 text-primary border-b-2 border-primary"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  }
                `}
              >
                <link.icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
          </nav>
        </div>
        </div>
      </div>
    </TooltipProvider>
  );
}