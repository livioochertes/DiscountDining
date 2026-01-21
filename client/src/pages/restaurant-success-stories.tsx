import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ArrowRight, TrendingUp, Users, Star, DollarSign, Clock } from "lucide-react";

export default function RestaurantSuccessStories() {
  const [, setLocation] = useLocation();

  const successStories = [
    {
      restaurantName: "Bella Vista Italiana",
      owner: "Marco Romano",
      location: "Downtown Rome",
      stats: {
        monthlyRevenue: "€45,000",
        customerIncrease: "280%",
        vouchersActive: "1,250",
        rating: "4.8"
      },
      quote: "EatOff transformed our business completely. We went from struggling during slow seasons to having consistent revenue year-round through voucher pre-sales.",
      results: [
        "Increased customer base by 280% in 6 months",
        "Generated €45,000 monthly recurring revenue",
        "Improved cash flow with advance voucher sales",
        "Enhanced customer loyalty and retention"
      ]
    },
    {
      restaurantName: "Sushi Zen",
      owner: "Akira Tanaka",
      location: "City Center Tokyo",
      stats: {
        monthlyRevenue: "¥2,800,000",
        customerIncrease: "350%",
        vouchersActive: "890",
        rating: "4.9"
      },
      quote: "The voucher system allowed us to offer premium dining experiences at accessible prices, attracting food enthusiasts who became regular customers.",
      results: [
        "Expanded customer reach beyond local neighborhood",
        "Reduced food waste through predictable demand",
        "Increased average order value by 40%",
        "Built sustainable business model"
      ]
    },
    {
      restaurantName: "Le Petit Bistro",
      owner: "Sophie Dubois",
      location: "Montmartre, Paris",
      stats: {
        monthlyRevenue: "€38,500",
        customerIncrease: "190%",
        vouchersActive: "675",
        rating: "4.7"
      },
      quote: "EatOff helped us survive the pandemic and thrive afterwards. The voucher sales provided essential cash flow when we needed it most.",
      results: [
        "Survived economic downturns with voucher pre-sales",
        "Discovered new customer segments",
        "Improved operational planning and staffing",
        "Enhanced community relationships"
      ]
    }
  ];

  const benefits = [
    {
      icon: <DollarSign className="h-8 w-8 text-green-600" />,
      title: "Increased Revenue",
      description: "Average 250% increase in monthly revenue within 6 months",
      detail: "Restaurants see immediate cash flow improvement through voucher pre-sales"
    },
    {
      icon: <Users className="h-8 w-8 text-blue-600" />,
      title: "Customer Growth",
      description: "Attract new customers with discounted voucher packages",
      detail: "Expand beyond your local area and reach food enthusiasts citywide"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-purple-600" />,
      title: "Business Stability",
      description: "Predictable revenue through advance voucher sales",
      detail: "Plan operations, staffing, and inventory with confidence"
    },
    {
      icon: <Star className="h-8 w-8 text-orange-600" />,
      title: "Higher Ratings",
      description: "Satisfied customers leave better reviews and ratings",
      detail: "Quality-focused customers appreciate the value and experience"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Restaurant Success Stories</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover how restaurants are transforming their business with EatOff's voucher platform. 
              Real stories from real restaurant owners who've grown their revenue and customer base.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Success Stories */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Real Restaurant Transformations</h2>
          <div className="space-y-12">
            {successStories.map((story, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="md:flex">
                  <div className="md:w-2/3 p-8">
                    <CardHeader className="px-0 pt-0">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <CardTitle className="text-2xl text-primary mb-1">{story.restaurantName}</CardTitle>
                          <CardDescription className="text-lg">
                            {story.owner} • {story.location}
                          </CardDescription>
                        </div>
                        <div className="flex items-center">
                          <Star className="h-5 w-5 text-yellow-400 mr-1" />
                          <span className="font-semibold text-lg">{story.stats.rating}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-0">
                      <blockquote className="text-lg text-gray-700 italic mb-6">
                        "{story.quote}"
                      </blockquote>
                      <h4 className="font-semibold text-gray-900 mb-3">Key Results:</h4>
                      <ul className="space-y-2">
                        {story.results.map((result, i) => (
                          <li key={i} className="flex items-start">
                            <ArrowRight className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600">{result}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </div>
                  <div className="md:w-1/3 bg-gray-50 p-8">
                    <h4 className="font-semibold text-gray-900 mb-6 text-center">Performance Metrics</h4>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{story.stats.monthlyRevenue}</div>
                        <div className="text-sm text-gray-600">Monthly Revenue</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">{story.stats.customerIncrease}</div>
                        <div className="text-sm text-gray-600">Customer Increase</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600">{story.stats.vouchersActive}</div>
                        <div className="text-sm text-gray-600">Active Vouchers</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits Overview */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Why Restaurants Choose EatOff</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="mx-auto mb-4 p-3 bg-gray-50 rounded-full w-fit">
                    {benefit.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{benefit.description}</p>
                  <p className="text-xs text-gray-500">{benefit.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-16 bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Platform Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-gray-600">Partner Restaurants</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">€2.5M+</div>
              <div className="text-gray-600">Revenue Generated</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">250%</div>
              <div className="text-gray-600">Avg. Growth Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">50K+</div>
              <div className="text-gray-600">Happy Customers</div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-primary/5 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Transform Your Restaurant?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join hundreds of successful restaurants already using EatOff to grow their business, 
            improve cash flow, and build lasting customer relationships.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => setLocation("/restaurant-login")}
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg"
            >
              Join Our Platform
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/support")}
              className="border-primary text-primary hover:bg-primary/10 px-8 py-3 text-lg"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}