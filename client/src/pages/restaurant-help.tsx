import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { 
  ArrowRight, 
  MessageCircle, 
  Mail, 
  Phone, 
  HelpCircle, 
  BookOpen, 
  CreditCard, 
  Users,
  Settings,
  Smartphone,
  TrendingUp,
  FileText,
  BarChart3
} from "lucide-react";

export default function RestaurantHelp() {
  const [, setLocation] = useLocation();

  const helpTopics = [
    {
      icon: <Settings className="h-6 w-6 text-primary" />,
      title: "Getting Started",
      description: "Set up your restaurant profile and start accepting voucher sales.",
      items: [
        "Creating your restaurant account",
        "Setting up your profile and menu",
        "Creating your first voucher packages",
        "Understanding the approval process"
      ]
    },
    {
      icon: <CreditCard className="h-6 w-6 text-green-600" />,
      title: "Payment & Commissions",
      description: "Learn about payment processing, payouts, and commission structure.",
      items: [
        "How commission payments work",
        "Setting up banking information",
        "Understanding payout schedules",
        "Managing refunds and cancellations"
      ]
    },
    {
      icon: <Smartphone className="h-6 w-6 text-blue-600" />,
      title: "QR Scanner & Redemption",
      description: "Use the QR scanner to process voucher redemptions efficiently.",
      items: [
        "Installing the QR scanner app",
        "Scanning customer vouchers",
        "Processing partial redemptions",
        "Handling redemption issues"
      ]
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-purple-600" />,
      title: "Analytics & Reports",
      description: "Track your performance and understand customer behavior.",
      items: [
        "Reading sales analytics",
        "Understanding customer metrics",
        "Revenue tracking and forecasting",
        "Export reports for accounting"
      ]
    }
  ];

  const contactOptions = [
    {
      icon: <MessageCircle className="h-8 w-8 text-primary" />,
      title: "Business Chat",
      description: "Get priority support for restaurant partners",
      availability: "24/7 Business Support",
      action: "Start Business Chat",
      buttonClass: "bg-primary hover:bg-primary/90 text-white"
    },
    {
      icon: <Phone className="h-8 w-8 text-green-600" />,
      title: "Restaurant Hotline",
      description: "Direct phone line for restaurant partners",
      availability: "Mon-Sun 8AM-10PM",
      action: "Call Hotline",
      buttonClass: "bg-green-600 hover:bg-green-700 text-white"
    },
    {
      icon: <Mail className="h-8 w-8 text-blue-600" />,
      title: "Partner Support",
      description: "Email support for business inquiries",
      availability: "Response within 4 hours",
      action: "Email Support",
      buttonClass: "bg-blue-600 hover:bg-blue-700 text-white"
    }
  ];

  const faqs = [
    {
      question: "How much commission does EatOff charge?",
      answer: "EatOff charges a 5.5% commission on voucher sales. This covers payment processing, platform maintenance, customer support, and marketing to drive customers to your restaurant."
    },
    {
      question: "When do I receive payments from voucher sales?",
      answer: "Payments are processed weekly on Fridays for all voucher sales from the previous week. Funds typically arrive in your bank account within 2-3 business days."
    },
    {
      question: "Can I modify voucher packages after they're published?",
      answer: "Yes, you can modify pricing, descriptions, and availability. However, packages already purchased by customers cannot be retroactively changed."
    },
    {
      question: "What happens if I need to temporarily close my restaurant?",
      answer: "You can pause voucher sales and redemptions in your restaurant portal. Existing voucher holders will be notified, and validity periods can be extended if needed."
    },
    {
      question: "How do I handle customer complaints about vouchers?",
      answer: "Contact our restaurant support team immediately. We'll mediate between you and the customer to find a fair resolution that maintains your restaurant's reputation."
    }
  ];

  const quickLinks = [
    {
      icon: <FileText className="h-6 w-6 text-primary" />,
      title: "Restaurant Portal Guide",
      description: "Complete guide to using your restaurant dashboard",
      action: () => setLocation("/restaurant-portal")
    },
    {
      icon: <Smartphone className="h-6 w-6 text-green-600" />,
      title: "QR Scanner",
      description: "Access the voucher redemption scanner",
      action: () => setLocation("/restaurant-scanner")
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-blue-600" />,
      title: "Success Stories",
      description: "Learn from other successful restaurants",
      action: () => setLocation("/restaurant-success-stories")
    },
    {
      icon: <Users className="h-6 w-6 text-purple-600" />,
      title: "Join Our Platform",
      description: "Start your journey with EatOff",
      action: () => setLocation("/restaurant-login")
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Restaurant Help Center</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to succeed on the EatOff platform. Get help with setup, payments, 
              voucher management, and growing your restaurant business.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Quick Actions */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Get Immediate Help</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {contactOptions.map((option, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border-2 hover:border-primary/20">
                <CardContent className="text-center p-8">
                  <div className="mx-auto mb-4 p-3 bg-gray-50 rounded-full w-fit">
                    {option.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">{option.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{option.description}</p>
                  <div className="mb-6">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {option.availability}
                    </span>
                  </div>
                  <Button className={`w-full ${option.buttonClass}`}>
                    {option.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Help Topics */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Help Topics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {helpTopics.map((topic, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3 mb-2">
                    {topic.icon}
                    <CardTitle className="text-lg">{topic.title}</CardTitle>
                  </div>
                  <CardDescription>{topic.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {topic.items.map((item, i) => (
                      <li key={i} className="flex items-center text-sm text-gray-600">
                        <ArrowRight className="h-3 w-3 text-primary mr-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Frequently Asked Questions</h2>
          <div className="max-w-4xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-start">
                    <HelpCircle className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    {faq.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 ml-7">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickLinks.map((link, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={link.action}>
                <CardContent className="p-6">
                  <div className="mx-auto mb-3 p-2 bg-gray-50 rounded-full w-fit">
                    {link.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">{link.title}</h3>
                  <p className="text-gray-600 text-xs">{link.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Business Support */}
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Personalized Support?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Our restaurant success team is here to help you maximize your earnings and grow your business on EatOff.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg">
              Schedule a Call
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/restaurant-login")}
              className="border-primary text-primary hover:bg-primary/10 px-8 py-3 text-lg"
            >
              Access Portal
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}