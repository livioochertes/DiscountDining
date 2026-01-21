import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ArrowRight, CreditCard, MapPin, Star, Gift, Calendar, Users, Shield } from "lucide-react";

export default function HowItWorks() {
  const [, setLocation] = useLocation();

  const steps = [
    {
      icon: <MapPin className="h-8 w-8 text-primary" />,
      title: "Discover Restaurants",
      description: "Browse our marketplace of partner restaurants in your area. Filter by cuisine, price range, or location to find your perfect dining spot.",
      details: ["Location-based search", "Cuisine filtering", "Price range options", "Restaurant ratings"]
    },
    {
      icon: <Gift className="h-8 w-8 text-primary" />,
      title: "Choose Voucher Packages",
      description: "Select from flexible voucher packages offered by restaurants. Choose meal counts from 3 to 40+ with discounts up to 70%.",
      details: ["Flexible meal counts", "Custom discount rates", "Various validity periods", "Multiple package tiers"]
    },
    {
      icon: <CreditCard className="h-8 w-8 text-primary" />,
      title: "Secure Payment",
      description: "Complete your purchase with our secure Stripe payment system. Support for cards, digital wallets, and multiple payment methods.",
      details: ["Stripe secure payments", "Google Pay & Apple Pay", "Multiple currencies", "Instant confirmation"]
    },
    {
      icon: <Calendar className="h-8 w-8 text-primary" />,
      title: "Enjoy Your Meals",
      description: "Use your vouchers whenever you want during the validity period. Track usage and manage your vouchers through your account.",
      details: ["Flexible usage timing", "Voucher tracking", "Usage history", "Balance management"]
    }
  ];

  const benefits = [
    {
      icon: <Star className="h-6 w-6 text-primary" />,
      title: "Save Money",
      description: "Get discounts up to 70% on your favorite restaurants with our voucher packages."
    },
    {
      icon: <Users className="h-6 w-6 text-primary" />,
      title: "Discover New Places",
      description: "Find new restaurants and cuisines through our curated marketplace and AI recommendations."
    },
    {
      icon: <Shield className="h-6 w-6 text-primary" />,
      title: "Secure & Reliable",
      description: "All transactions are secured with Stripe, and your vouchers are safely stored in your account."
    },
    {
      icon: <Gift className="h-6 w-6 text-primary" />,
      title: "Flexible Packages",
      description: "Choose from various package sizes and validity periods that fit your dining habits."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">How EatOff Works</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Save money on dining with our innovative restaurant voucher system. 
              Here's how to get started and make the most of your dining experience.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* How It Works Steps */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Getting Started in 4 Simple Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <Card key={index} className="relative">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                    {step.icon}
                  </div>
                  <div className="absolute top-4 right-4 bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-gray-600 mb-4">
                    {step.description}
                  </CardDescription>
                  <ul className="space-y-1 text-sm text-gray-500">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-center">
                        <ArrowRight className="h-3 w-3 text-primary mr-2 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Why Choose EatOff?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="flex items-start space-x-4 p-6">
                  <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                    <p className="text-gray-600 text-sm">{benefit.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Frequently Asked Questions</h2>
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How do voucher packages work?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Voucher packages allow you to purchase multiple meals at a discounted rate from participating restaurants. 
                  You can use these vouchers over the validity period, giving you flexibility and savings on your dining experiences.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens if I don't use all my vouchers?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Vouchers have a validity period set by each restaurant (typically 6-24 months). 
                  You can track your usage through your account and plan your visits accordingly to maximize value.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Are there any restrictions on voucher usage?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Restrictions vary by restaurant and are clearly displayed when purchasing. 
                  Most vouchers can be used for any menu items, but some may have specific terms regarding holidays, special menus, or minimum orders.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I get a refund on voucher packages?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Refund policies depend on the individual restaurant's terms. 
                  Generally, unused vouchers within the validity period may be eligible for refunds. Check the specific terms when purchasing.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Start Saving?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of food lovers who are already saving money and discovering amazing restaurants with EatOff.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => setLocation("/")}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg"
            >
              Browse Restaurants
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/register")}
              className="border-primary text-primary hover:bg-primary/10 px-8 py-3 text-lg"
            >
              Create Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}