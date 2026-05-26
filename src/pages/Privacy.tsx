import React, { useEffect } from 'react';
import { Shield, Mail, Globe, ArrowLeft, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Privacy: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Scroll to top on load
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="group mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-church-600 transition-colors"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          Back
        </button>

        {/* Hero Section */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-100 mb-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-slate-50 rounded-full -z-0 opacity-50" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center p-3 bg-church-50 text-church-600 rounded-2xl mb-6">
              <Shield size={32} />
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight mb-4">
              Privacy Policy
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar size={14} />
                Effective Date: May 26, 2026
              </span>
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
              <span className="font-semibold text-church-600">PCI Champhai Bethel Kohhran</span>
            </div>
          </div>
        </div>

        {/* Policy Content */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-100 prose prose-slate max-w-none space-y-8">
          
          <p className="text-slate-600 leading-relaxed text-lg">
            This Privacy Policy describes how we handle user data and privacy for our mobile application (the "App"). 
            We are committed to protecting your privacy and ensuring that any information processed through the App is 
            handled securely and in accordance with standard data privacy regulations, including Google Play Developer Policies.
          </p>

          <p className="text-slate-600 leading-relaxed text-lg">
            By using the App, you agree to the collection and use of information in accordance with this policy.
          </p>

          <hr className="border-slate-100 py-2" />

          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-church-50 text-church-600 text-sm font-bold">1</span>
              Information Collection and Use
            </h2>
            <p className="text-slate-600 leading-relaxed">
              We value your privacy and strive to minimize the amount of data we collect. Depending on how you interact with the App, the following types of information may be processed:
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mt-4">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-2">Personal Data</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  When registering or using certain features of the App, you may be asked to provide certain personally identifiable information, including but not limited to:
                </p>
                <ul className="space-y-1.5 text-sm text-slate-700 font-medium">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-church-500" />
                    Name
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-church-500" />
                    Email Address
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-church-500" />
                    User account credentials
                  </li>
                </ul>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-2">Device and Usage Data</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  We may automatically collect certain information when you access the App via a mobile device, including:
                </p>
                <ul className="space-y-1.5 text-sm text-slate-700 font-medium">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-church-500" />
                    The type of mobile device you use
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-church-500" />
                    Your mobile device's unique ID
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-church-500" />
                    The IP address of your mobile device
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-church-500" />
                    Your mobile operating system
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-church-500" />
                    Diagnostic data, crash logs, and performance metrics
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-church-50 text-church-600 text-sm font-bold">2</span>
              Third-Party Services and Data Processing
            </h2>
            <p className="text-slate-600 leading-relaxed">
              To provide, maintain, and optimize our application services, we utilize trusted third-party services. These third parties may process data on our behalf to help analyze how our App is used, authenticate users, or manage backend infrastructure.
            </p>
            <p className="text-slate-600 leading-relaxed">
              These third-party services have their own independent privacy policies. We encourage you to review them:
            </p>
            <div className="space-y-3 pt-2">
              <a 
                href="https://policies.google.com/privacy" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-church-200 hover:bg-slate-50 transition-all group"
              >
                <div>
                  <h4 className="font-bold text-slate-900">Google Play Services</h4>
                  <p className="text-xs text-slate-400">View user data and core integration privacy practices</p>
                </div>
                <Globe size={16} className="text-slate-300 group-hover:text-church-600 transition-colors" />
              </a>

              <a 
                href="https://firebase.google.com/support/privacy" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-church-200 hover:bg-slate-50 transition-all group"
              >
                <div>
                  <h4 className="font-bold text-slate-900">Firebase (Authentication, Firestore, Analytics, Crashlytics)</h4>
                  <p className="text-xs text-slate-400">View server-side authentication database and analytics privacy</p>
                </div>
                <Globe size={16} className="text-slate-300 group-hover:text-church-600 transition-colors" />
              </a>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-church-50 text-church-600 text-sm font-bold">3</span>
              Data Retention and Security
            </h2>
            <p className="text-slate-600 leading-relaxed">
              We retain your personal information only for as long as is necessary to fulfill the purposes outlined in this Privacy Policy, or as required by law.
            </p>
            <p className="text-slate-600 leading-relaxed">
              The security of your data is highly important to us. We implement industry-standard administrative, technical, and physical security measures (such as secure HTTPS encryption) to protect your information against unauthorized access, loss, or misuse. However, please remember that no method of transmission over the internet or method of electronic storage is 100% secure.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-church-50 text-church-600 text-sm font-bold">4</span>
              User Rights and Data Deletion
            </h2>
            <p className="text-slate-600 leading-relaxed">
              You have the right to access, update, correct, or request the deletion of your personal information at any time.
            </p>
            <p className="text-slate-600 leading-relaxed">
              If you have created an account within the App and wish to delete your account along with all associated personal data, you can do so through the account settings menu inside the App, or by contacting us directly at the email address provided below. Upon receiving a valid deletion request, we will permanently remove your data from our active databases and connected third-party services (such as Firebase) within standard administrative timelines.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-church-50 text-church-600 text-sm font-bold">5</span>
              Children's Privacy
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Our services do not address anyone under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If we discover that a child under 13 has provided us with personal data, we will immediately delete this information from our servers. If you are a parent or guardian and you are aware that your child has provided us with personal data, please contact us so that we can take the necessary actions.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-church-50 text-church-600 text-sm font-bold">6</span>
              Changes to This Privacy Policy
            </h2>
            <p className="text-slate-600 leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Effective Date" at the top of this policy. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-church-50 text-church-600 text-sm font-bold">7</span>
              Contact Us
            </h2>
            <p className="text-slate-600 leading-relaxed">
              If you have any questions, concerns, or requests regarding this Privacy Policy or your data, please contact us at:
            </p>
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <Mail className="text-church-600 mt-0.5 shrink-0" size={18} />
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Email Contact</h4>
                  <a href="mailto:kohhranb@gmail.com" className="text-sm font-medium text-church-600 hover:text-church-700 break-all">
                    kohhranb@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <Globe className="text-church-600 mt-0.5 shrink-0" size={18} />
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Website URL</h4>
                  <a href="https://www.cpibethel.com" target="_blank" rel="noreferrer" className="text-sm font-medium text-church-600 hover:text-church-700">
                    https://www.cpibethel.com
                  </a>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Privacy;
