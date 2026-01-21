import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building, MapPin, CreditCard, Globe } from "lucide-react";

const bankingFormSchema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  bankAccountNumber: z.string().min(1, "Account number is required"),
  bankRoutingNumber: z.string().min(1, "Routing number is required"),
  bankAccountHolderName: z.string().min(1, "Account holder name is required"),
  iban: z.string().optional(),
  swiftCode: z.string().optional(),
  bankAddress: z.string().optional(),
  accountType: z.string().min(1, "Account type is required")
});

type BankingFormData = z.infer<typeof bankingFormSchema>;

export default function BankingInformationForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<BankingFormData>({
    resolver: zodResolver(bankingFormSchema),
    defaultValues: {
      bankName: "",
      bankAccountNumber: "",
      bankRoutingNumber: "",
      bankAccountHolderName: "",
      iban: "",
      swiftCode: "",
      bankAddress: "",
      accountType: ""
    }
  });

  // Fetch current banking information
  const { data: ownerProfile, isLoading } = useQuery({
    queryKey: ['/api/restaurant-portal/owner/profile'],
    enabled: true
  });

  // Update form when profile data is loaded
  useEffect(() => {
    if (ownerProfile) {
      form.reset({
        bankName: ownerProfile.bankName || "",
        bankAccountNumber: ownerProfile.bankAccountNumber || "",
        bankRoutingNumber: ownerProfile.bankRoutingNumber || "",
        bankAccountHolderName: ownerProfile.bankAccountHolderName || "",
        iban: ownerProfile.iban || "",
        swiftCode: ownerProfile.swiftCode || "",
        bankAddress: ownerProfile.bankAddress || "",
        accountType: ownerProfile.accountType || ""
      });
    }
  }, [ownerProfile, form]);

  const updateBankingMutation = useMutation({
    mutationFn: async (data: BankingFormData) => {
      const response = await apiRequest("PUT", "/api/restaurant-portal/owner/banking", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Banking Information Updated",
        description: "Your banking details have been saved successfully."
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/restaurant-portal/owner/profile'] });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update banking information.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: BankingFormData) => {
    updateBankingMutation.mutate(data);
  };

  const handleCancel = () => {
    if (ownerProfile) {
      form.reset({
        bankName: ownerProfile.bankName || "",
        bankAccountNumber: ownerProfile.bankAccountNumber || "",
        bankRoutingNumber: ownerProfile.bankRoutingNumber || "",
        bankAccountHolderName: ownerProfile.bankAccountHolderName || "",
        iban: ownerProfile.iban || "",
        swiftCode: ownerProfile.swiftCode || "",
        bankAddress: ownerProfile.bankAddress || "",
        accountType: ownerProfile.accountType || ""
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-200 h-6 w-32 rounded"></div>
        <div className="animate-pulse bg-gray-200 h-10 rounded"></div>
        <div className="animate-pulse bg-gray-200 h-10 rounded"></div>
      </div>
    );
  }

  const hasExistingData = ownerProfile?.bankName || ownerProfile?.bankAccountNumber;

  return (
    <div className="space-y-6">
      {!isEditing && hasExistingData ? (
        // Display mode
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building className="w-5 h-5" />
                  Domestic Banking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Bank Name</Label>
                  <p className="text-sm font-semibold">{ownerProfile.bankName || "Not set"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Account Holder</Label>
                  <p className="text-sm font-semibold">{ownerProfile.bankAccountHolderName || "Not set"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Account Type</Label>
                  <p className="text-sm font-semibold">{ownerProfile.accountType || "Not set"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Account Number</Label>
                  <p className="text-sm font-mono">
                    {ownerProfile.bankAccountNumber ? 
                      `****${ownerProfile.bankAccountNumber.slice(-4)}` : 
                      "Not set"
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Routing Number</Label>
                  <p className="text-sm font-mono">{ownerProfile.bankRoutingNumber || "Not set"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Globe className="w-5 h-5" />
                  International Banking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-gray-600">IBAN</Label>
                  <p className="text-sm font-mono">{ownerProfile.iban || "Not set"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">SWIFT Code</Label>
                  <p className="text-sm font-mono">{ownerProfile.swiftCode || "Not set"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Bank Address</Label>
                  <p className="text-sm">{ownerProfile.bankAddress || "Not set"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setIsEditing(true)}>
              Edit Banking Information
            </Button>
          </div>
        </div>
      ) : (
        // Edit/Create mode
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building className="w-5 h-5" />
                    Domestic Banking Details
                  </CardTitle>
                  <p className="text-sm text-gray-600">Required for domestic payments and transfers</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Chase Bank" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bankAccountHolderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Holder Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name on account" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accountType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select account type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="checking">Checking</SelectItem>
                            <SelectItem value="savings">Savings</SelectItem>
                            <SelectItem value="business">Business</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bankAccountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="Account number" type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bankRoutingNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Routing Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="9-digit routing number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Globe className="w-5 h-5" />
                    International Banking Details
                  </CardTitle>
                  <p className="text-sm text-gray-600">Optional for international payments</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="iban"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IBAN</FormLabel>
                        <FormControl>
                          <Input placeholder="International Bank Account Number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="swiftCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SWIFT Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Bank Identifier Code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bankAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Address</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Full bank address including country" 
                            className="resize-none"
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            <Separator />

            <div className="flex justify-end gap-3">
              {hasExistingData && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={updateBankingMutation.isPending}
                >
                  Cancel
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={updateBankingMutation.isPending}
                className="min-w-32"
              >
                {updateBankingMutation.isPending ? "Saving..." : "Save Banking Information"}
              </Button>
            </div>
          </form>
        </Form>
      )}

      {!hasExistingData && !isEditing && (
        <div className="text-center py-8">
          <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium mb-2">No Banking Information</h3>
          <p className="text-gray-600 mb-4">Add your banking details to receive payments from EatOff</p>
          <Button onClick={() => setIsEditing(true)}>
            Add Banking Information
          </Button>
        </div>
      )}
    </div>
  );
}