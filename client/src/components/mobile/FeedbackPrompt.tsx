import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Star, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FeedbackPromptProps {
  customerId: number;
  restaurantId: number;
  orderId?: number;
  reservationId?: number;
  restaurantName?: string;
  onDismiss: () => void;
  onSubmitted?: () => void;
}

export function FeedbackPrompt({
  customerId,
  restaurantId,
  orderId,
  reservationId,
  restaurantName,
  onDismiss,
  onSubmitted,
}: FeedbackPromptProps) {
  const [overallRating, setOverallRating] = useState(0);
  const [foodRating, setFoodRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [ambienceRating, setAmbienceRating] = useState(0);
  const [comment, setComment] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async () => {
      const body: any = {
        customerId,
        restaurantId,
        overallRating,
      };
      if (orderId) body.orderId = orderId;
      if (reservationId) body.reservationId = reservationId;
      if (foodRating > 0) body.foodRating = foodRating;
      if (serviceRating > 0) body.serviceRating = serviceRating;
      if (ambienceRating > 0) body.ambienceRating = ambienceRating;
      if (comment.trim()) body.comment = comment.trim();

      const response = await apiRequest("POST", "/api/crm/feedback", body);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Thank you!", description: "Your feedback has been submitted." });
      queryClient.invalidateQueries({ queryKey: ["/api/crm/feedback"] });
      onSubmitted?.();
      onDismiss();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit feedback",
        variant: "destructive",
      });
    },
  });

  function StarRatingRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">{label}</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              className="p-0.5"
            >
              <Star
                className={cn(
                  "w-6 h-6 transition-colors",
                  s <= value ? "fill-amber-400 text-amber-400" : "text-gray-300"
                )}
              />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-orange-200 shadow-lg p-4 mx-4 my-3">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900 text-sm">How was your experience?</h4>
          {restaurantName && (
            <p className="text-xs text-gray-500 mt-0.5">at {restaurantName}</p>
          )}
        </div>
        <button onClick={onDismiss} className="p-1 text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <StarRatingRow label="Overall *" value={overallRating} onChange={setOverallRating} />

      {!showDetails && overallRating > 0 && (
        <button
          onClick={() => setShowDetails(true)}
          className="text-xs text-orange-600 mt-2 hover:underline"
        >
          + Rate food, service & ambience
        </button>
      )}

      {showDetails && (
        <div className="space-y-2 mt-3 pt-3 border-t border-gray-100">
          <StarRatingRow label="Food" value={foodRating} onChange={setFoodRating} />
          <StarRatingRow label="Service" value={serviceRating} onChange={setServiceRating} />
          <StarRatingRow label="Ambience" value={ambienceRating} onChange={setAmbienceRating} />
        </div>
      )}

      {overallRating > 0 && (
        <div className="mt-3">
          <Textarea
            placeholder="Leave a comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="text-sm resize-none"
            rows={2}
          />
        </div>
      )}

      <div className="flex items-center justify-end gap-2 mt-3">
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          Skip
        </Button>
        <Button
          size="sm"
          onClick={() => submitMutation.mutate()}
          disabled={overallRating === 0 || submitMutation.isPending}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Send className="w-3.5 h-3.5 mr-1" />
          {submitMutation.isPending ? "Sending..." : "Submit"}
        </Button>
      </div>
    </div>
  );
}
