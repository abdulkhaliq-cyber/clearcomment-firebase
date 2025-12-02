import { Link } from 'react-router-dom';
import { ScaleIcon, EnvelopeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const Terms = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <Link to="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold mb-4">
                        ← Back to Home
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg">
                            <ScaleIcon className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
                            <p className="text-sm text-gray-500 mt-1">Last Updated: December 2, 2024</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                    <div className="p-8 sm:p-12 space-y-8">

                        {/* Introduction */}
                        <section>
                            <p className="text-gray-700 leading-relaxed">
                                Please read these Terms of Service ("Terms") carefully before using the ClearComment service operated by ClearComment ("us", "we", or "our"). Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms.
                            </p>
                        </section>

                        {/* 1. Acceptance of Terms */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                                <DocumentTextIcon className="h-6 w-6 mr-2 text-primary-600" />
                                1. Acceptance of Terms
                            </h2>
                            <p className="text-gray-700">
                                By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.
                            </p>
                        </section>

                        {/* 2. Description of Service */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
                            <div className="space-y-3 text-gray-700">
                                <p>ClearComment provides automated comment moderation tools for Facebook Pages. Our service allows you to:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Connect your Facebook Pages</li>
                                    <li>Set up automated rules to hide or delete comments</li>
                                    <li>View and manage comments from a centralized dashboard</li>
                                    <li>Analyze comment activity and moderation statistics</li>
                                </ul>
                            </div>
                        </section>

                        {/* 3. User Accounts and Responsibilities */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts and Responsibilities</h2>
                            <div className="space-y-4 text-gray-700">
                                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                    <h3 className="font-semibold text-gray-900 mb-2">3.1 Account Security</h3>
                                    <p>You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You agree not to disclose your password to any third party.</p>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                    <h3 className="font-semibold text-gray-900 mb-2">3.2 Authorized Use</h3>
                                    <p>You represent and warrant that you are authorized to connect and manage the Facebook Pages you add to our Service. You must comply with all applicable laws and Facebook's Terms of Service.</p>
                                </div>
                            </div>
                        </section>

                        {/* 4. Acceptable Use */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use</h2>
                            <div className="space-y-3 text-gray-700">
                                <p>You agree not to use the Service to:</p>
                                <ul className="list-disc list-inside space-y-2 ml-4">
                                    <li>Violate any laws or regulations</li>
                                    <li>Infringe upon the rights of others</li>
                                    <li>Harass, abuse, or harm another person</li>
                                    <li>Interfere with or disrupt the Service or servers</li>
                                    <li>Attempt to gain unauthorized access to any part of the Service</li>
                                </ul>
                            </div>
                        </section>

                        {/* 5. Intellectual Property */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Intellectual Property</h2>
                            <p className="text-gray-700">
                                The Service and its original content, features, and functionality are and will remain the exclusive property of ClearComment and its licensors. The Service is protected by copyright, trademark, and other laws.
                            </p>
                        </section>

                        {/* 6. Termination */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Termination</h2>
                            <p className="text-gray-700">
                                We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
                            </p>
                        </section>

                        {/* 7. Limitation of Liability */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitation of Liability</h2>
                            <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                                <p className="text-gray-700">
                                    In no event shall ClearComment, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                                </p>
                            </div>
                        </section>

                        {/* 8. Changes to Terms */}
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Changes to Terms</h2>
                            <p className="text-gray-700">
                                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                            </p>
                        </section>

                        {/* Contact Information */}
                        <section className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-8 border border-primary-200">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                                <EnvelopeIcon className="h-6 w-6 mr-2 text-primary-600" />
                                9. Contact Us
                            </h2>
                            <div className="space-y-3 text-gray-700">
                                <p>If you have any questions about these Terms, please contact us:</p>
                                <div className="bg-white rounded-lg p-6 mt-4 space-y-2">
                                    <p><strong>Email:</strong> <a href="mailto:legal@clearcomment.com" className="text-primary-600 hover:text-primary-700">legal@clearcomment.com</a></p>
                                </div>
                            </div>
                        </section>

                    </div>
                </div>

                {/* Footer Links */}
                <div className="mt-8 text-center space-x-6">
                    <Link to="/privacy" className="text-primary-600 hover:text-primary-700 font-semibold">
                        Privacy Policy
                    </Link>
                    <Link to="/" className="text-gray-600 hover:text-gray-700">
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Terms;
