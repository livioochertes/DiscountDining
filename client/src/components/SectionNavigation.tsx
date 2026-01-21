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

  // Add null check for t.sectionNavigation to prevent crashes
  if (!t || !t.sectionNavigation) {
    return <div>Loading...</div>;
  }

  const sections = [
    {
      id: "users" as const,
      title: t.sectionNavigation.users || "Users",
      icon: Users,
      description: t.sectionNavigation.usersDesc || "Customer dashboard",
      links: [
        { href: "/dashboard", label: t.dashboard, icon: BarChart3 },
        { href: "/my-orders", label: t.orders, icon: ShoppingCart },
        { href: "/my-vouchers", label: t.myVouchers, icon: Award },
        { href: "/points", label: t.pointsRewards, icon: CreditCard },
        { href: "/profile", label: t.profile, icon: UserCheck },
      ]
    },
    {
      id: "restaurants" as const,
      title: t.sectionNavigation.restaurants,
      icon: Store,
      description: t.sectionNavigation.restaurantsDesc,
      links: [
        { href: "/restaurant-portal", label: t.sectionNavigation.dashboard, icon: BarChart3 },
        { href: "/restaurant-portal/packages", label: t.sectionNavigation.voucherPackages, icon: Award },
        { href: "/restaurant-portal/menu", label: t.sectionNavigation.menuManagement, icon: Store },
        { href: "/restaurant-portal/orders", label: t.sectionNavigation.orderHistory, icon: ShoppingCart },
        { href: "/restaurant-portal/finances", label: t.sectionNavigation.finances, icon: CreditCard },
      ]
    },
    {
      id: "admin" as const,
      title: t.sectionNavigation.admin,
      icon: Settings,
      description: t.sectionNavigation.adminDesc,
      links: [
        { href: "/admin", label: t.sectionNavigation.adminDashboard, icon: BarChart3, tab: "overview" },
        { href: "/admin", label: "EatOff Vouchers", icon: Award, tab: "eatoff-vouchers" },
        { href: "/admin", label: t.sectionNavigation.restaurantMgmt, icon: Store, tab: "restaurants" },
        { href: "/admin", label: "Partners Admin", icon: Building2, tab: "partners" },
        { href: "/admin", label: t.sectionNavigation.userMgmt, icon: Users, tab: "users" },
        { href: "/admin", label: t.sectionNavigation.financialMgmt, icon: CreditCard, tab: "finances" },
        { href: "/admin", label: t.sectionNavigation.platformSettings, icon: Settings, tab: "settings" },
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