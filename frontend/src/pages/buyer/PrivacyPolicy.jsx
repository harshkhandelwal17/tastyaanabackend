import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ChevronDown,
  ChevronUp,
  Shield,
  Eye,
  Lock,
  Database,
  Globe,
  UserCheck,
  Settings,
  AlertCircle,
  CheckCircle,
  Download,
  Mail,
  Phone,
} from "lucide-react";

const PrivacyPolicyPage = () => {
  const [expandedSections, setExpandedSections] = useState({});
  const [readingProgress, setReadingProgress] = useState(0);
  const [cookiePreferences, setCookiePreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false,
  });

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

  const handleCookiePreference = (type) => {
    if (type === "necessary") return; // Can't disable necessary cookies
    setCookiePreferences((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const privacyData = {
    lastUpdated: "July 9, 2025",
    effectiveDate: "July 1, 2025",
    companyName: "TechStore Inc.",
    contactEmail: "privacy@techstore.com",
    dpoEmail: "dpo@techstore.com",
    sections: [
      {
        id: "overview",
        title: "1. Privacy Overview",
        icon: Shield,
        summary: "Our commitment to protecting your privacy",
        content: `
          <p>At TechStore, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.</p>
          
          <h4>Our Privacy Principles:</h4>
          <ul>
            <li><strong>Transparency:</strong> We clearly explain what data we collect and how we use it</li>
            <li><strong>Choice:</strong> You have control over your personal information</li>
            <li><strong>Security:</strong> We protect your data with industry-standard security measures</li>
            <li><strong>Minimal Collection:</strong> We only collect data that's necessary for our services</li>
          </ul>
          
          <p>This policy applies to all users of our website, mobile applications, and related services. By using our services, you agree to the collection and use of information in accordance with this policy.</p>
        `,
      },
      {
        id: "collection",
        title: "2. Information We Collect",
        icon: Database,
        summary: "Types of personal data we gather",
        content: `
          <p>We collect several types of information from and about users of our services:</p>
          
          <h4>Personal Information You Provide:</h4>
          <ul>
            <li>Account registration details (name, email, password)</li>
            <li>Contact information (phone number, billing/shipping addresses)</li>
            <li>Payment information (credit card details, billing address)</li>
            <li>Profile information (preferences, reviews, wishlist)</li>
            <li>Communication data (customer service interactions, surveys)</li>
          </ul>
          
          <h4>Information Collected Automatically:</h4>
          <ul>
            <li>Device information (IP address, browser type, operating system)</li>
            <li>Usage data (pages visited, time spent, clicks, search queries)</li>
            <li>Location data (general geographic location based on IP)</li>
            <li>Cookies and tracking technologies</li>
          </ul>
          
          <h4>Information from Third Parties:</h4>
          <ul>
            <li>Social media login information (if you choose to connect accounts)</li>
            <li>Payment processor information</li>
            <li>Delivery service updates</li>
            <li>Credit check information (for financing options)</li>
          </ul>
        `,
      },
      {
        id: "usage",
        title: "3. How We Use Your Information",
        icon: Settings,
        summary: "Purposes for processing your personal data",
        content: `
          <p>We use the information we collect for various purposes to provide and improve our services:</p>
          
          <h4>Service Delivery:</h4>
          <ul>
            <li>Process and fulfill your orders</li>
            <li>Manage your account and provide customer support</li>
            <li>Send order confirmations and shipping updates</li>
            <li>Process payments and prevent fraud</li>
          </ul>
          
          <h4>Communication:</h4>
          <ul>
            <li>Respond to your inquiries and requests</li>
            <li>Send important service announcements</li>
            <li>Provide customer support and technical assistance</li>
            <li>Send marketing communications (with your consent)</li>
          </ul>
          
          <h4>Website Improvement:</h4>
          <ul>
            <li>Analyze usage patterns to improve our website</li>
            <li>Personalize your shopping experience</li>
            <li>Develop new features and services</li>
            <li>Conduct research and analytics</li>
          </ul>
          
          <h4>Legal and Security:</h4>
          <ul>
            <li>Comply with legal obligations</li>
            <li>Protect against fraud and security threats</li>
            <li>Enforce our terms and conditions</li>
            <li>Resolve disputes and investigate issues</li>
          </ul>
        `,
      },
      {
        id: "sharing",
        title: "4. Information Sharing",
        icon: Globe,
        summary: "When and with whom we share your data",
        content: `
          <p>We do not sell, trade, or rent your personal information to third parties. We may share your information in the following limited circumstances:</p>
          
          <h4>Service Providers:</h4>
          <ul>
            <li>Payment processors (for transaction processing)</li>
            <li>Shipping companies (for order delivery)</li>
            <li>Cloud hosting providers (for data storage)</li>
            <li>Email service providers (for communications)</li>
            <li>Analytics providers (for website improvement)</li>
          </ul>
          
          <h4>Business Transfers:</h4>
          <ul>
            <li>In connection with mergers, acquisitions, or asset sales</li>
            <li>During bankruptcy or reorganization proceedings</li>
            <li>With your consent or as required by law</li>
          </ul>
          
          <h4>Legal Requirements:</h4>
          <ul>
            <li>To comply with court orders or legal processes</li>
            <li>To respond to government requests</li>
            <li>To protect our rights and property</li>
            <li>To ensure user safety and prevent fraud</li>
          </ul>
          
          <p>All third parties are contractually obligated to protect your information and use it only for the specified purposes.</p>
        `,
      },
      {
        id: "cookies",
        title: "5. Cookies and Tracking",
        icon: Eye,
        summary: "How we use cookies and similar technologies",
        content: `
          <p>We use cookies and similar tracking technologies to enhance your browsing experience and gather information about how you use our website.</p>
          
          <h4>Types of Cookies We Use:</h4>
          <ul>
            <li><strong>Necessary Cookies:</strong> Essential for website functionality (cannot be disabled)</li>
            <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website</li>
            <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements</li>
            <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
          </ul>
          
          <h4>Third-Party Cookies:</h4>
          <ul>
            <li>Google Analytics (for website analytics)</li>
            <li>Facebook Pixel (for advertising)</li>
            <li>Payment processors (for secure transactions)</li>
            <li>Customer support tools (for live chat functionality)</li>
          </ul>
          
          <h4>Managing Cookies:</h4>
          <p>You can control cookies through your browser settings or using our cookie preference center below. Note that disabling certain cookies may affect website functionality.</p>
        `,
      },
      {
        id: "security",
        title: "6. Data Security",
        icon: Lock,
        summary: "How we protect your personal information",
        content: `
          <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
          
          <h4>Security Measures:</h4>
          <ul>
            <li><strong>Encryption:</strong> All data transmission uses SSL/TLS encryption</li>
            <li><strong>Access Controls:</strong> Strict employee access controls and authentication</li>
            <li><strong>Monitoring:</strong> Continuous monitoring for security threats</li>
            <li><strong>Regular Audits:</strong> Periodic security assessments and updates</li>
          </ul>
          
          <h4>Data Storage:</h4>
          <ul>
            <li>Data stored in secure, SOC 2 compliant data centers</li>
            <li>Regular backups with encrypted storage</li>
            <li>Geographic distribution for disaster recovery</li>
            <li>Retention policies to minimize data exposure</li>
          </ul>
          
          <h4>Your Security:</h4>
          <ul>
            <li>Use strong, unique passwords for your account</li>
            <li>Enable two-factor authentication when available</li>
            <li>Keep your contact information updated</li>
            <li>Report suspicious activity immediately</li>
          </ul>
          
          <p>While we strive to protect your information, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security but are committed to maintaining the highest standards.</p>
        `,
      },
      {
        id: "rights",
        title: "7. Your Privacy Rights",
        icon: UserCheck,
        summary: "Your rights regarding your personal data",
        content: `
          <p>You have certain rights regarding your personal information, which may vary depending on your location:</p>
          
          <h4>Universal Rights:</h4>
          <ul>
            <li><strong>Access:</strong> Request copies of your personal data</li>
            <li><strong>Correction:</strong> Update or correct inaccurate information</li>
            <li><strong>Deletion:</strong> Request deletion of your personal data</li>
            <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
          </ul>
          
          <h4>Additional Rights (GDPR/CCPA):</h4>
          <ul>
            <li><strong>Opt-out:</strong> Decline sale or sharing of personal information</li>
            <li><strong>Restriction:</strong> Limit how we process your data</li>
            <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
            <li><strong>Automated Decision-Making:</strong> Opt-out of automated profiling</li>
          </ul>
          
          <h4>How to Exercise Your Rights:</h4>
          <ul>
            <li>Email us at ${privacyData.contactEmail}</li>
            <li>Use the privacy settings in your account</li>
            <li>Contact our Data Protection Officer</li>
            <li>Submit requests through our online form</li>
          </ul>
          
          <p>We will respond to valid requests within 30 days (or as required by applicable law). Some requests may require identity verification.</p>
        `,
      },
      {
        id: "retention",
        title: "8. Data Retention",
        icon: Database,
        summary: "How long we keep your information",
        content: `
          <p>We retain your personal information only for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law.</p>
          
          <h4>Retention Periods:</h4>
          <ul>
            <li><strong>Account Information:</strong> Until account deletion + 30 days</li>
            <li><strong>Order History:</strong> 7 years (for tax and legal compliance)</li>
            <li><strong>Payment Data:</strong> As required by payment processors (typically 7 years)</li>
            <li><strong>Marketing Data:</strong> Until opt-out + 30 days</li>
            <li><strong>Support Communications:</strong> 3 years</li>
            <li><strong>Website Analytics:</strong> 26 months (Google Analytics default)</li>
          </ul>
          
          <h4>Deletion Process:</h4>
          <ul>
            <li>Automated deletion based on retention schedules</li>
            <li>Secure data destruction methods</li>
            <li>Anonymization where complete deletion isn't possible</li>
            <li>Documentation of deletion activities</li>
          </ul>
          
          <h4>Legal Holds:</h4>
          <p>In some cases, we may need to retain information longer due to legal obligations, ongoing investigations, or disputes. We will inform you if this affects your data.</p>
        `,
      },
      {
        id: "international",
        title: "9. International Data Transfers",
        icon: Globe,
        summary: "How we handle data across borders",
        content: `
          <p>TechStore is based in the United States, and your information may be transferred to and processed in countries other than your own.</p>
          
          <h4>Transfer Safeguards:</h4>
          <ul>
            <li>Standard Contractual Clauses (SCCs) for EU data transfers</li>
            <li>Adequacy decisions where available</li>
            <li>Certification programs (Privacy Shield successors)</li>
            <li>Binding Corporate Rules for internal transfers</li>
          </ul>
          
          <h4>Countries We Transfer To:</h4>
          <ul>
            <li><strong>United States:</strong> Our primary data processing location</li>
            <li><strong>European Union:</strong> For EU customers and GDPR compliance</li>
            <li><strong>Canada:</strong> For certain customer support services</li>
            <li><strong>Australia:</strong> For Asia-Pacific operations</li>
          </ul>
          
          <h4>Your Protections:</h4>
          <p>Regardless of where your data is processed, we maintain the same high standards of protection outlined in this policy. All international transfers comply with applicable data protection laws.</p>
        `,
      },
      {
        id: "children",
        title: "10. Children's Privacy",
        icon: Shield,
        summary: "Special protections for minors",
        content: `
          <p>Our services are not intended for children under 13 years of age, and we do not knowingly collect personal information from children under 13.</p>
          
          <h4>Age Verification:</h4>
          <ul>
            <li>Account creation requires age confirmation</li>
            <li>Additional verification for purchases</li>
            <li>Parental consent required for users under 18</li>
          </ul>
          
          <h4>If We Learn of Child Data Collection:</h4>
          <ul>
            <li>Immediate deletion of the information</li>
            <li>Account suspension or termination</li>
            <li>Notification to parents/guardians</li>
            <li>Review of collection practices</li>
          </ul>
          
          <h4>Parental Rights:</h4>
          <p>Parents or guardians can contact us to review, modify, or delete their child's information. We will verify parental authority before taking any action.</p>
          
          <p>If you believe we have collected information from a child under 13, please contact us immediately at ${privacyData.contactEmail}.</p>
        `,
      },
      {
        id: "changes",
        title: "11. Policy Updates",
        icon: AlertCircle,
        summary: "How we notify you of privacy policy changes",
        content: `
          <p>We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors.</p>
          
          <h4>Types of Changes:</h4>
          <ul>
            <li><strong>Minor Updates:</strong> Clarifications, contact information, formatting</li>
            <li><strong>Material Changes:</strong> New data collection, sharing practices, or use purposes</li>
            <li><strong>Legal Updates:</strong> Changes required by new laws or regulations</li>
          </ul>
          
          <h4>Notification Methods:</h4>
          <ul>
            <li>Email notification to registered users</li>
            <li>Prominent website notice</li>
            <li>In-app notifications</li>
            <li>30-day advance notice for material changes</li>
          </ul>
          
          <h4>Your Options:</h4>
          <ul>
            <li>Review changes before they take effect</li>
            <li>Contact us with questions or concerns</li>
            <li>Modify your privacy settings</li>
            <li>Delete your account if you disagree</li>
          </ul>
          
          <p>The "Last Updated" date at the top of this policy indicates when the most recent changes were made.</p>
        `,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        .privacy-content h4 { font-weight: 600; color: #1f2937; margin: 1rem 0 0.5rem 0; }
        .privacy-content ul { margin-left: 1rem; margin-bottom: 1rem; }
        .privacy-content li { list-style-type: disc; margin-bottom: 0.25rem; }
        .privacy-content p { margin-bottom: 0.75rem; }
        .privacy-content a { color: #2563eb; text-decoration: underline; }
        .privacy-content a:hover { color: #1d4ed8; }
        .privacy-content strong { font-weight: 600; color: #374151; }
      `}</style>

      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div
          className="h-full bg-green-600 transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        ></div>
      </div>

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-12 h-12 text-green-600 mr-4" />
              <h1 className="text-4xl font-bold text-gray-900">
                Privacy Policy
              </h1>
            </div>
            <p className="text-xl text-gray-600 mb-6">
              Your privacy is important to us. Learn how we protect and use your
              information.
            </p>
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Last Updated: {privacyData.lastUpdated}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Effective: {privacyData.effectiveDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Summary */}
        <div className="bg-green-50 border-l-4 border-green-500 p-6 mb-8">
          <div className="flex items-start">
            <Shield className="w-6 h-6 text-green-600 mr-3 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Privacy at a Glance
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-green-800">
                <div>
                  <h4 className="font-medium mb-1">We Collect:</h4>
                  <p className="text-sm">
                    Only data necessary for our services
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">We Protect:</h4>
                  <p className="text-sm">
                    Your data with industry-standard security
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">We Don't:</h4>
                  <p className="text-sm">
                    Sell your personal information to third parties
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">You Control:</h4>
                  <p className="text-sm">
                    Your data with comprehensive privacy rights
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cookie Preferences */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Cookie Preferences
          </h2>
          <p className="text-gray-600 mb-6">
            Manage how we use cookies and similar technologies on our website.
          </p>

          <div className="space-y-4">
            {[
              {
                key: "necessary",
                label: "Necessary Cookies",
                description: "Required for basic website functionality",
                required: true,
              },
              {
                key: "analytics",
                label: "Analytics Cookies",
                description: "Help us understand how you use our website",
                required: false,
              },
              {
                key: "marketing",
                label: "Marketing Cookies",
                description: "Used to show you relevant advertisements",
                required: false,
              },
              {
                key: "functional",
                label: "Functional Cookies",
                description: "Remember your preferences and settings",
                required: false,
              },
            ].map((cookie) => (
              <div
                key={cookie.key}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <h4 className="font-medium text-gray-900">{cookie.label}</h4>
                  <p className="text-sm text-gray-600">{cookie.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cookiePreferences[cookie.key]}
                    onChange={() => handleCookiePreference(cookie.key)}
                    disabled={cookie.required}
                    className="sr-only peer"
                  />
                  <div
                    className={`relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer ${
                      cookiePreferences[cookie.key]
                        ? "peer-checked:bg-blue-600"
                        : ""
                    } ${
                      cookie.required ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <div
                      className={`absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-all ${
                        cookiePreferences[cookie.key]
                          ? "translate-x-full border-white"
                          : ""
                      }`}
                    ></div>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Sections */}
        <div className="space-y-4">
          {privacyData.sections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSections[section.id];

            return (
              <div key={section.id} className="bg-white rounded-lg shadow-lg">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Icon className="w-5 h-5 text-green-600" />
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
                        className="privacy-content"
                        dangerouslySetInnerHTML={{ __html: section.content }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Data Protection Officer */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Contact Our Data Protection Team
          </h2>
          <p className="text-gray-600 mb-6">
            Have questions about our privacy practices or want to exercise your
            privacy rights? We're here to help.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">
                Privacy Questions
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">General Privacy</p>
                    <a
                      href={`mailto:${privacyData.contactEmail}`}
                      className="text-green-600 hover:text-green-700"
                    >
                      {privacyData.contactEmail}
                    </a>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Data Protection Officer
                    </p>
                    <a
                      href={`mailto:${privacyData.dpoEmail}`}
                      className="text-green-600 hover:text-green-700"
                    >
                      {privacyData.dpoEmail}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                  Request My Data
                </button>
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  Update Preferences
                </button>
                <button className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                  Delete My Account
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Download Options */}
        <div className="bg-gray-100 rounded-lg p-6 mt-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Take This Policy With You
          </h3>
          <p className="text-gray-600 mb-4">
            Download a copy of our Privacy Policy for your records
          </p>
          <div className="flex justify-center space-x-4">
            <button className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors border">
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors border">
              <Download className="w-4 h-4" />
              <span>Print Version</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
