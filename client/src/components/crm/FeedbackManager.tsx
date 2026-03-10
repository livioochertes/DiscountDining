import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, MessageSquare, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";

interface FeedbackManagerProps {
  restaurantId: number;
}

export default function FeedbackManager({ restaurantId }: FeedbackManagerProps) {
  const [minRating, setMinRating] = useState<string>("all");
  const [page, setPage] = useState(1);

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("limit", "20");
  if (minRating !== "all") {
    queryParams.set("minRating", minRating);
    queryParams.set("maxRating", minRating);
  }

  const { data, isLoading } = useQuery({
    queryKey: ["/api/crm/feedback", restaurantId, minRating, page],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/crm/feedback/${restaurantId}?${queryParams.toString()}`);
      return response.json();
    },
  });

  const feedbackList = data?.feedback || [];
  const averages = data?.averages || {};
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 0;

  function renderStars(rating: number | null) {
    if (!rating) return <span className="text-gray-400 text-xs">N/A</span>;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`w-3.5 h-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Customer Feedback</h3>
        <p className="text-sm text-gray-500">View and manage customer ratings and reviews</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <RatingCard
          label="Overall"
          value={averages.avgOverall}
          count={averages.totalCount}
          loading={isLoading}
        />
        <RatingCard
          label="Food"
          value={averages.avgFood}
          loading={isLoading}
        />
        <RatingCard
          label="Service"
          value={averages.avgService}
          loading={isLoading}
        />
        <RatingCard
          label="Ambience"
          value={averages.avgAmbience}
          loading={isLoading}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Filter by rating:</span>
          <Select value={minRating} onValueChange={(v) => { setMinRating(v); setPage(1); }}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="All ratings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ratings</SelectItem>
              <SelectItem value="5">5 stars</SelectItem>
              <SelectItem value="4">4 stars</SelectItem>
              <SelectItem value="3">3 stars</SelectItem>
              <SelectItem value="2">2 stars</SelectItem>
              <SelectItem value="1">1 star</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <span className="text-sm text-gray-500">{total} reviews</span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : feedbackList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No feedback yet</p>
            <p className="text-sm text-gray-400 mt-1">Customer reviews will appear here after they submit feedback.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {feedbackList.map((fb: any) => (
            <Card key={fb.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {fb.customerFirstName || ""} {fb.customerLastName || fb.customerEmail || "Anonymous"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {fb.createdAt ? new Date(fb.createdAt).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Overall:</span>
                        {renderStars(fb.overallRating)}
                      </div>
                      {fb.foodRating && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">Food:</span>
                          {renderStars(fb.foodRating)}
                        </div>
                      )}
                      {fb.serviceRating && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">Service:</span>
                          {renderStars(fb.serviceRating)}
                        </div>
                      )}
                      {fb.ambienceRating && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">Ambience:</span>
                          {renderStars(fb.ambienceRating)}
                        </div>
                      )}
                    </div>
                    {fb.comment && (
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 mt-2">
                        "{fb.comment}"
                      </p>
                    )}
                  </div>
                  <Badge className={
                    fb.overallRating >= 4 ? "bg-green-100 text-green-700" :
                    fb.overallRating >= 3 ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                  }>
                    {fb.overallRating}/5
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
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
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function RatingCard({ label, value, count, loading }: { label: string; value?: number | null; count?: number; loading: boolean }) {
  const numVal = value ? Number(value) : 0;
  return (
    <Card>
      <CardContent className="p-4 text-center">
        {loading ? (
          <Skeleton className="h-10 w-16 mx-auto" />
        ) : (
          <>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className={`w-5 h-5 ${numVal > 0 ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
              <span className="text-2xl font-bold">{numVal > 0 ? numVal : "—"}</span>
            </div>
            <p className="text-xs text-gray-500">{label}</p>
            {count !== undefined && (
              <p className="text-xs text-gray-400 mt-0.5">{count} reviews</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
