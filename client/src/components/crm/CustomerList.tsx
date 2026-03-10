import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, Users } from "lucide-react";
import CustomerDetailPanel from "./CustomerDetailPanel";

interface CustomerListProps {
  restaurantId: number;
}

const TIER_COLORS: Record<string, string> = {
  bronze: "bg-amber-100 text-amber-800",
  silver: "bg-gray-200 text-gray-700",
  gold: "bg-yellow-100 text-yellow-800",
  platinum: "bg-purple-100 text-purple-800",
  black: "bg-black text-white",
};

export default function CustomerList({ restaurantId }: CustomerListProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("totalSpent");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const limit = 15;

  const queryParams = new URLSearchParams({
    sort: sortField,
    order: sortOrder,
    page: String(page),
    limit: String(limit),
  });
  if (search) queryParams.set("search", search);
  if (segmentFilter && segmentFilter !== "all") queryParams.set("segmentId", segmentFilter);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/crm/customers", restaurantId, search, sortField, sortOrder, page, segmentFilter],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/crm/customers/${restaurantId}?${queryParams.toString()}`);
      return response.json();
    },
  });

  const { data: segments = [] } = useQuery({
    queryKey: ["/api/crm/segments", restaurantId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/crm/segments/${restaurantId}`);
      return response.json();
    },
  });

  const customers = data?.customers || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 0;

  function toggleSort(field: string) {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setPage(1);
  }

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function getDisplayName(c: any): string {
    return c.name || c.email || "Unknown";
  }

  const sortIndicator = (field: string) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? " ↑" : " ↓";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-orange-500" />
          Customer List
          {!isLoading && <Badge variant="secondary">{total}</Badge>}
        </h3>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={segmentFilter} onValueChange={(v) => { setSegmentFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Segments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Segments</SelectItem>
            {segments.map((seg: any) => (
              <SelectItem key={seg.id} value={String(seg.id)}>
                {seg.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No customers found</p>
          <p className="text-gray-400 text-sm mt-1">
            {search ? "Try a different search term" : "Customers will appear here after they enroll"}
          </p>
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">
                      <button className="flex items-center gap-1 hover:text-gray-900" onClick={() => toggleSort("name")}>
                        Name{sortIndicator("name")}
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Tier</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">
                      <button className="flex items-center gap-1 ml-auto hover:text-gray-900" onClick={() => toggleSort("totalSpent")}>
                        Total Spent{sortIndicator("totalSpent")}
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">
                      <button className="flex items-center gap-1 ml-auto hover:text-gray-900" onClick={() => toggleSort("orderCount")}>
                        Orders{sortIndicator("orderCount")}
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">
                      <button className="flex items-center gap-1 ml-auto hover:text-gray-900" onClick={() => toggleSort("lastOrderDate")}>
                        Last Visit{sortIndicator("lastOrderDate")}
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">
                      <button className="flex items-center gap-1 ml-auto hover:text-gray-900" onClick={() => toggleSort("avgOrderValue")}>
                        Avg Order{sortIndicator("avgOrderValue")}
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden xl:table-cell">Programs</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {customers.map((c: any) => (
                    <tr
                      key={c.id}
                      className="hover:bg-orange-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedCustomerId(c.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {c.profilePicture ? (
                            <img src={c.profilePicture} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold">
                              {(c.name?.[0] || c.email?.[0] || "?").toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{getDisplayName(c)}</p>
                            <p className="text-xs text-gray-500">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {c.membershipTier && (
                          <Badge className={TIER_COLORS[c.membershipTier] || "bg-gray-100 text-gray-700"}>
                            {c.membershipTier}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        €{(c.totalSpent || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell text-gray-600">
                        {c.orderCount || 0}
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell text-gray-500 text-xs">
                        {c.lastOrderDate
                          ? new Date(c.lastOrderDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell text-gray-600">
                        €{(c.avgOrderValue || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <div className="flex gap-1">
                          {c.hasCashback && <Badge variant="outline" className="text-xs border-green-300 text-green-700">Cashback</Badge>}
                          {c.hasLoyalty && <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">Loyalty</Badge>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {selectedCustomerId && (
        <CustomerDetailPanel
          restaurantId={restaurantId}
          customerId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
        />
      )}
    </div>
  );
}
