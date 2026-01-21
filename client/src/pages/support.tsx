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
  Utensils,
  Settings,
  Shield,
  Clock,
  Users
} from "lucide-react";

export default function Support() {
  const [, setLocation] = useLocation();

  const supportTopics = [
    {
      icon: <HelpCircle className="h-6 w-6 text-primary" />,
      title: "Getting Started",
      description: "Learn how to use EatOff, browse restaurants, and purchase your first voucher package.",
      items: [
        "How to create an account",
        "Browsing restaurants and packages",
        "Making your first purchase",
        "Using vouchers at restaurants"
      ]
    },
    {
      icon: <CreditCard className="h-6 w-6 text-primary" />,
      title: "Payments & Billing",
      description: "Help with payments, refunds, and billing questions.",
      items: [
        "Payment methods accepted",
        "Refund policy and process",
        "Billing statement questions",
        "Failed payment troubleshooting"
      ]
    },
    {
      icon: <Utensils className="h-6 w-6 text-primary" />,
      title: "Voucher Management",
      description: "Everything about managing and using your voucher packages.",
      items: [
        "How to redeem vouchers",
        "Checking voucher balance",
        "Voucher expiration dates",
        "Transferring vouchers"
      ]
    },
    {
      icon: <Settings className="h-6 w-6 text-primary" />,
      title: "Account Management",
      description: "Manage your profile, preferences, and account settings.",
      items: [
        "Updating profile information",
        "Changing password",
        "Dietary preferences setup",
        "Notification settings"
      ]
    }
  ];

  const contactOptions = [
    {
      icon: <MessageCircle className="h-8 w-8 text-primary" />,
      title: "Live Chat",
      description: "Get instant help from our support team",
      availability: "24/7 Available",
      action: "Start Chat",
      buttonClass: "bg-primary hover:bg-primary/90 text-white"
    },
    {
      icon: <Mail className="h-8 w-8 text-blue-600" />,
      title: "Email Support",
      description: "Send us a detailed message about your issue",
      availability: "Response within 24 hours",
      action: "Send Email",
      buttonClass: "bg-blue-600 hover:bg-blue-700 text-white"
    },
    {
      icon: <Phone className="h-8 w-8 text-green-600" />,
      title: "Phone Support",
      description: "Speak directly with our support team",
      availability: "Mon-Fri 9AM-6PM EST",
      action: "Call Now",
      buttonClass: "bg-green-600 hover:bg-green-700 text-white"
    }
  ];

  const faqs = [
    {
      question: "How do I use my vouchers at restaurants?",
      answer: "Simply show your voucher QR code from the EatOff app to your server when ordering. They'll scan it and deduct the appropriate amount from your voucher balance."
    },
    {
      question: "Can I get a refund on unused vouchers?",
      answer: "Refund policies vary by restaurant. Most vouchers can be refunded within 30 days of purchase if unused. Check the specific terms when purchasing."
    },
    {
      question: "What happens if a restaurant closes?",
      answer: "If a partner restaurant permanently closes, we'll help transfer your vouchers to a similar restaurant or provide a full refund for unused vouchers."
    },
    {
      question: "How do I change my dietary preferences?",
      answer: "Go to your Profile page and click on 'Dietary Profile' to update your preferences, allergies, and dietary restrictions for better AI recommendations."
    },
    {
      question: "Are there any fees for using EatOff?",
      answer: "EatOff is free to use for customers. We don't charge any additional fees beyond the voucher package prices set by restaurants."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Customer Support</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're here to help! Find answers to common questions or get in touch with our support team.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Quick Actions */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Get Help Fast</h2>
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

        {/* Support Topics */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Support Topics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {supportTopics.map((topic, index) => (
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

        {/* Additional Resources */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Additional Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <BookOpen className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">User Guide</h3>
                <p className="text-gray-600 text-sm mb-4">Complete guide to using EatOff platform</p>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation("/how-it-works")}
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  Read Guide
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <Shield className="h-8 w-8 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Privacy Policy</h3>
                <p className="text-gray-600 text-sm mb-4">Learn how we protect your data</p>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation("/privacy-policy")}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  View Policy
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <Users className="h-8 w-8 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Community</h3>
                <p className="text-gray-600 text-sm mb-4">Join our community forum</p>
                <Button 
                  variant="outline" 
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  Join Forum
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Status Information */}
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
          <div className="flex items-center justify-center mb-4">
            <Clock className="h-6 w-6 text-green-600 mr-2" />
            <span className="text-green-600 font-semibold">All Systems Operational</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Need More Help?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Our support team is ready to assist you with any questions or issues you may have.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg">
              Contact Support
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/")}
              className="border-primary text-primary hover:bg-primary/10 px-8 py-3 text-lg"
            >
              Back to Marketplace
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}