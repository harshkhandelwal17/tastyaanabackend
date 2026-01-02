import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Scale,
  Shield,
  Clock,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Mail,
  Phone,
} from "lucide-react";

const TermsConditionsPage = () => {
  const [expandedSections, setExpandedSections] = useState({});
  const [readingProgress, setReadingProgress] = useState(0);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const dispatch = useDispatch();

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setReadingProgress(scrollPercent);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // dispatch(fetchCart());
    // dispatch(fetchWishlist());
    // dispatch(fetchOrders());
  }, [dispatch]);

  // Use Redux state for user/cart/wishlist/orders if needed

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const termsData = {
    lastUpdated: "July 9, 2025",
    effectiveDate: "July 1, 2025",
    companyName: "TechStore Inc.",
    contactEmail: "legal@techstore.com",
    sections: [
      {
        id: "acceptance",
        title: "1. Acceptance of Terms",
        icon: CheckCircle,
        summary: "By using our service, you agree to these terms",
        content: `
          <p>Welcome to TechStore! These Terms and Conditions ("Terms", "Terms and Conditions") govern your use of our website operated by TechStore Inc. ("us", "we", or "our").</p>
          
          <p>Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users and others who access or use the Service.</p>
          
          <p>By accessing or using our Service you agree to be bound by these Terms. If you disagree with any part of these terms then you may not access the Service.</p>
          
          <h4>Key Points:</h4>
          <ul>
            <li>You must be at least 18 years old to use our service</li>
            <li>You are responsible for maintaining account security</li>
            <li>These terms may be updated from time to time</li>
            <li>Continued use after changes constitutes acceptance</li>
          </ul>
        `,
      },
      {
        id: "accounts",
        title: "2. User Accounts",
        icon: Shield,
        summary: "Account creation, security, and responsibilities",
        content: `
          <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account.</p>
          
          <h4>Account Requirements:</h4>
          <ul>
            <li>Must be 18 years or older</li>
            <li>Provide accurate and complete information</li>
            <li>Maintain security of your account credentials</li>
            <li>Notify us immediately of any unauthorized access</li>
          </ul>
          
          <h4>Account Termination:</h4>
          <p>We reserve the right to terminate or suspend your account at any time for violations of these terms, including but not limited to:</p>
          <ul>
            <li>Providing false or misleading information</li>
            <li>Engaging in fraudulent activities</li>
            <li>Violating applicable laws or regulations</li>
            <li>Harassing other users or our staff</li>
          </ul>
        `,
      },
      {
        id: "products",
        title: "3. Products and Services",
        icon: FileText,
        summary: "Product descriptions, availability, and pricing",
        content: `
          <p>All products and services are subject to availability. We reserve the right to limit quantities and discontinue products at any time.</p>
          
          <h4>Product Information:</h4>
          <ul>
            <li>We strive for accuracy in all product descriptions and pricing</li>
            <li>Colors and specifications may vary from images shown</li>
            <li>Prices are subject to change without notice</li>
            <li>All prices are in USD unless otherwise specified</li>
          </ul>
          
          <h4>Availability:</h4>
          <p>Product availability is updated in real-time, however, in rare cases, an item may become unavailable after you place an order. In such cases:</p>
          <ul>
            <li>We will notify you immediately</li>
            <li>Offer suitable alternatives if available</li>
            <li>Provide a full refund if no alternatives are acceptable</li>
          </ul>
        `,
      },
      {
        id: "orders",
        title: "4. Orders and Payment",
        icon: Scale,
        summary: "Order processing, payment terms, and billing",
        content: `
          <p>By placing an order, you are making an offer to purchase products subject to these Terms and Conditions.</p>
          
          <h4>Order Process:</h4>
          <ul>
            <li>Order confirmation will be sent via email</li>
            <li>Orders are processed within 1-2 business days</li>
            <li>We reserve the right to refuse any order</li>
            <li>Bulk order discounts may be available</li>
          </ul>
          
          <h4>Payment Terms:</h4>
          <ul>
            <li>Payment is due at time of order</li>
            <li>We accept major credit cards and PayPal</li>
            <li>All transactions are processed securely</li>
            <li>Currency conversion fees may apply for international orders</li>
          </ul>
          
          <h4>Pricing Errors:</h4>
          <p>Despite our best efforts, pricing errors may occur. If we discover a pricing error after you've placed an order, we will contact you for instructions or cancel the order and issue a full refund.</p>
        `,
      },
      {
        id: "shipping",
        title: "5. Shipping and Delivery",
        icon: Clock,
        summary: "Shipping policies, delivery times, and responsibilities",
        content: `
          <p>We offer various shipping options to meet your needs. Delivery times and costs vary by location and shipping method selected.</p>
          
          <h4>Shipping Options:</h4>
          <ul>
            <li>Standard Shipping: 3-7 business days</li>
            <li>Express Shipping: 1-3 business days</li>
            <li>Overnight Shipping: Next business day</li>
            <li>International Shipping: 7-21 business days</li>
          </ul>
          
          <h4>Shipping Costs:</h4>
          <ul>
            <li>Calculated based on weight, size, and destination</li>
            <li>Free standard shipping on orders over $50</li>
            <li>Express and overnight shipping charges apply</li>
            <li>International shipping costs vary by country</li>
          </ul>
          
          <h4>Delivery Issues:</h4>
          <p>Risk of loss passes to you upon delivery to the carrier. However, we will work with you to resolve any delivery issues including lost or damaged packages.</p>
        `,
      },
      {
        id: "returns",
        title: "6. Returns and Refunds",
        icon: AlertTriangle,
        summary: "Return policy, refund process, and exceptions",
        content: `
          <p>We want you to be completely satisfied with your purchase. If you're not happy, we offer a comprehensive return policy.</p>
          
          <h4>Return Policy:</h4>
          <ul>
            <li>Returns accepted within 30 days of delivery</li>
            <li>Items must be in original condition and packaging</li>
            <li>Return shipping costs are customer responsibility</li>
            <li>Refunds processed within 5-10 business days</li>
          </ul>
          
          <h4>Non-Returnable Items:</h4>
          <ul>
            <li>Personalized or customized products</li>
            <li>Software or digital downloads</li>
            <li>Perishable goods</li>
            <li>Items damaged by misuse</li>
          </ul>
          
          <h4>Refund Process:</h4>
          <p>To initiate a return, contact our customer service team with your order number. We'll provide return instructions and a prepaid return label for eligible items.</p>
        `,
      },
      {
        id: "privacy",
        title: "7. Privacy and Data Protection",
        icon: Shield,
        summary: "How we collect, use, and protect your information",
        content: `
          <p>Your privacy is important to us. This section outlines how we handle your personal information in conjunction with our Privacy Policy.</p>
          
          <h4>Information Collection:</h4>
          <ul>
            <li>Personal information you provide during registration</li>
            <li>Transaction and payment information</li>
            <li>Website usage data and analytics</li>
            <li>Customer service communications</li>
          </ul>
          
          <h4>Data Protection:</h4>
          <ul>
            <li>Industry-standard encryption for all data transmission</li>
            <li>Secure storage of personal and payment information</li>
            <li>Regular security audits and updates</li>
            <li>Limited access to personal data on need-to-know basis</li>
          </ul>
          
          <p>For complete details on our privacy practices, please review our <a href="/privacy-policy" class="text-blue-600 hover:text-blue-700">Privacy Policy</a>.</p>
        `,
      },
      {
        id: "intellectual",
        title: "8. Intellectual Property",
        icon: FileText,
        summary: "Copyright, trademarks, and usage rights",
        content: `
          <p>The Service and its original content, features and functionality are and will remain the exclusive property of TechStore Inc. and its licensors.</p>
          
          <h4>Our Intellectual Property:</h4>
          <ul>
            <li>Website design, layout, and functionality</li>
            <li>TechStore logos, trademarks, and branding</li>
            <li>Product descriptions and marketing materials</li>
            <li>Software and applications</li>
          </ul>
          
          <h4>Your Use Rights:</h4>
          <ul>
            <li>Personal, non-commercial use of our website</li>
            <li>Right to share product information for review purposes</li>
            <li>Limited reproduction for personal reference</li>
          </ul>
          
          <h4>Prohibited Uses:</h4>
          <ul>
            <li>Commercial use without written permission</li>
            <li>Reproduction or distribution of copyrighted content</li>
            <li>Reverse engineering of our software</li>
            <li>Use of our trademarks without authorization</li>
          </ul>
        `,
      },
      {
        id: "liability",
        title: "9. Limitation of Liability",
        icon: AlertTriangle,
        summary: "Legal disclaimers and liability limitations",
        content: `
          <p>To the fullest extent permitted by applicable law, TechStore Inc. shall not be liable for any indirect, incidental, special, consequential, or punitive damages.</p>
          
          <h4>Disclaimer of Warranties:</h4>
          <ul>
            <li>Service provided "as is" without warranties</li>
            <li>No guarantee of uninterrupted or error-free service</li>
            <li>Results and performance may vary</li>
            <li>Third-party content not under our control</li>
          </ul>
          
          <h4>Limitation of Damages:</h4>
          <p>Our total liability to you for any claim arising from or relating to these terms or our service shall not exceed the amount you paid to us in the 12 months preceding the claim.</p>
          
          <h4>Indemnification:</h4>
          <p>You agree to indemnify and hold harmless TechStore Inc. from any claims, damages, or expenses arising from your use of our service or violation of these terms.</p>
        `,
      },
      {
        id: "termination",
        title: "10. Termination",
        icon: ExternalLink,
        summary: "When and how these terms may end",
        content: `
          <p>We may terminate or suspend your access immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
          
          <h4>Termination by Us:</h4>
          <ul>
            <li>Violation of these Terms and Conditions</li>
            <li>Fraudulent or illegal activities</li>
            <li>Non-payment of fees</li>
            <li>At our sole discretion for any reason</li>
          </ul>
          
          <h4>Termination by You:</h4>
          <ul>
            <li>Close your account at any time</li>
            <li>Stop using our services</li>
            <li>Request data deletion (subject to legal requirements)</li>
          </ul>
          
          <h4>Effect of Termination:</h4>
          <p>Upon termination, your right to use the Service will cease immediately. Provisions that should survive termination will remain in effect.</p>
        `,
      },
      {
        id: "governing",
        title: "11. Governing Law",
        icon: Scale,
        summary: "Legal jurisdiction and applicable laws",
        content: `
          <p>These Terms shall be interpreted and governed by the laws of the State of [State], without regard to its conflict of law provisions.</p>
          
          <h4>Jurisdiction:</h4>
          <ul>
            <li>Exclusive jurisdiction in state and federal courts</li>
            <li>Located in [City, State]</li>
            <li>You consent to personal jurisdiction</li>
            <li>Waive any objection to venue</li>
          </ul>
          
          <h4>Dispute Resolution:</h4>
          <ul>
            <li>Good faith negotiation as first step</li>
            <li>Mediation if negotiation fails</li>
            <li>Binding arbitration for unresolved disputes</li>
            <li>Small claims court for eligible matters</li>
          </ul>
        `,
      },
      {
        id: "changes",
        title: "12. Changes to Terms",
        icon: Clock,
        summary: "How we update these terms and notify users",
        content: `
          <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time.</p>
          
          <h4>Notification Process:</h4>
          <ul>
            <li>Email notification to registered users</li>
            <li>Website banner notification</li>
            <li>30-day notice for material changes</li>
            <li>Updated terms posted on this page</li>
          </ul>
          
          <h4>Your Rights:</h4>
          <ul>
            <li>Review changes before they take effect</li>
            <li>Discontinue use if you disagree</li>
            <li>Contact us with questions or concerns</li>
          </ul>
          
          <p>Your continued use of the Service after any such changes constitutes your acceptance of the new Terms and Conditions.</p>
        `,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        .terms-content h4 { font-weight: 600; color: #1f2937; margin: 1rem 0 0.5rem 0; }
        .terms-content ul { margin-left: 1rem; margin-bottom: 1rem; }
        .terms-content li { list-style-type: disc; margin-bottom: 0.25rem; }
        .terms-content p { margin-bottom: 0.75rem; }
        .terms-content a { color: #2563eb; text-decoration: underline; }
        .terms-content a:hover { color: #1d4ed8; }
      `}</style>
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div
          className="h-full bg-blue-600 transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        ></div>
      </div>

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <FileText className="w-12 h-12 text-blue-600 mr-4" />
              <h1 className="text-4xl font-bold text-gray-900">
                Terms & Conditions
              </h1>
            </div>
            <p className="text-xl text-gray-600 mb-6">
              Please read these terms carefully before using our services
            </p>
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Last Updated: {termsData.lastUpdated}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Effective: {termsData.effectiveDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Introduction */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8">
          <div className="flex items-start">
            <AlertTriangle className="w-6 h-6 text-blue-600 mr-3 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Important Legal Information
              </h3>
              <p className="text-blue-800">
                These Terms and Conditions constitute a legally binding
                agreement between you and {termsData.companyName}. By using our
                website and services, you acknowledge that you have read,
                understood, and agree to be bound by these terms.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Quick Summary
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Your Rights:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Use our platform for personal shopping</li>
                <li>• 30-day return policy</li>
                <li>• Data privacy protection</li>
                <li>• Customer support access</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Your Responsibilities:
              </h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Provide accurate information</li>
                <li>• Pay for orders promptly</li>
                <li>• Use service lawfully</li>
                <li>• Protect account security</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="space-y-4">
          {termsData.sections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSections[section.id];

            return (
              <div key={section.id} className="bg-white rounded-lg shadow-lg">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {section.title}
                      </h3>
                      <p className="text-gray-600 text-sm">{section.summary}</p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6">
                    <div className="text-gray-700">
                      <div
                        className="terms-content"
                        dangerouslySetInnerHTML={{ __html: section.content }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Questions About These Terms?
          </h2>
          <p className="text-gray-600 mb-6">
            If you have any questions about these Terms and Conditions, please
            don't hesitate to contact us.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Email Support</p>
                <a
                  href={`mailto:${termsData.contactEmail}`}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {termsData.contactEmail}
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Phone Support</p>
                <a
                  href="tel:+15551234567"
                  className="text-blue-600 hover:text-blue-700"
                >
                  +1 (555) 123-4567
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Acceptance Checkbox */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="accept-terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="accept-terms" className="text-gray-700">
              <span className="font-medium">
                I have read and agree to the Terms and Conditions
              </span>
              <p className="text-sm text-gray-600 mt-1">
                By checking this box, you acknowledge that you have read these
                terms in their entirety and agree to be legally bound by them.
              </p>
            </label>
          </div>
          {acceptedTerms && (
            <div className="mt-4 flex items-center space-x-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">
                Thank you for accepting our Terms and Conditions!
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TermsConditionsPage;
