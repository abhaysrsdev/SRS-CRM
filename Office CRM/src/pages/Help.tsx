
import { HelpCircle, MessageCircle, PhoneCall, BookOpen, Mail } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from '../components/ui/motion';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

export function Help() {
  const faqs = [
    { q: "How does the CRM sync with my Ledger?", a: "The CRM parses your exported Excel files. Any updates made in the CRM are currently stored locally. True two-way sync requires backend integration." },
    { q: "Can I add custom fields to a Lead?", a: "Currently, the Lead structure is strictly defined by the system architecture to ensure data integrity across the UI." },
    { q: "What does the Demand Score mean?", a: "Demand score is an AI-mocked metric from 0-100 indicating the predicted velocity at which a product will sell based on historical trends." }
  ];

  return (
    <div className="min-h-full flex flex-col bg-brand-bg relative pb-12">
      <div className="p-8 pb-4 bg-white/50 backdrop-blur-md border-b border-slate-200 shadow-sm z-10 shrink-0">
        <FadeIn>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center shadow-inner">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Help & Support</h2>
              <p className="text-muted-foreground mt-1 text-sm">Documentation, FAQs, and contact channels.</p>
            </div>
          </div>
        </FadeIn>
      </div>

      <div className="p-8 max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Support Channels */}
        <div className="space-y-6 lg:col-span-1">
          <StaggerContainer className="space-y-4">
            <StaggerItem>
              <Card className="border-0 shadow-soft hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="mx-auto h-12 w-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Live Chat</h3>
                    <p className="text-sm text-slate-500 mt-1">Get instant help from our support team.</p>
                  </div>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">Start Chat</Button>
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="border-0 shadow-soft hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="mx-auto h-12 w-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                    <PhoneCall className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Phone Support</h3>
                    <p className="text-sm text-slate-500 mt-1">Mon-Fri, 9am - 6pm IST</p>
                  </div>
                  <Button variant="outline" className="w-full rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold">
                    1800-123-4567
                  </Button>
                </CardContent>
              </Card>
            </StaggerItem>
          </StaggerContainer>
        </div>

        {/* FAQs */}
        <div className="lg:col-span-2 space-y-6">
          <FadeIn delay={0.2}>
            <Card className="border-0 shadow-soft h-full">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                  <BookOpen className="h-5 w-5 text-brand-primary" />
                  <h3 className="text-xl font-bold text-slate-900">Frequently Asked Questions</h3>
                </div>

                <div className="space-y-6">
                  {faqs.map((faq, index) => (
                    <div key={index} className="space-y-2 group cursor-pointer">
                      <h4 className="font-bold text-slate-800 text-lg group-hover:text-brand-primary transition-colors">{faq.q}</h4>
                      <p className="text-slate-600 leading-relaxed text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between bg-brand-primary/5 p-4 rounded-xl border-brand-primary/10">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Still have questions?</h4>
                    <p className="text-xs text-slate-500">Our support team is ready to help.</p>
                  </div>
                  <Button variant="ghost" className="gap-2 text-brand-primary hover:bg-brand-primary/10 rounded-xl font-bold">
                    <Mail className="h-4 w-4" />
                    Email Us
                  </Button>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </div>

      </div>
    </div>
  );
}
