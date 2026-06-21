import React from 'react';
import { UserPlus, Save, Briefcase, Mail, Phone, MapPin } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from '../components/ui/motion';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

export function AddLead() {
  return (
    <div className="min-h-full flex flex-col bg-brand-bg relative pb-12">
      <div className="p-8 pb-4 bg-white/50 backdrop-blur-md border-b border-slate-200 shadow-sm z-10 shrink-0">
        <FadeIn>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">New Lead Onboarding</h2>
              <p className="text-muted-foreground mt-1 text-sm">Create a new prospect entry in the CRM database.</p>
            </div>
          </div>
        </FadeIn>
      </div>

      <div className="p-8 max-w-4xl mx-auto w-full">
        <FadeIn delay={0.2}>
          <Card className="border-0 shadow-xl shadow-brand-primary/5 rounded-3xl overflow-hidden bg-white">
            <CardContent className="p-8">
              <StaggerContainer className="space-y-8">
                
                {/* Basic Info */}
                <StaggerItem>
                  <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Business Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Party/Business Name</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Enter business name" className="pl-10 bg-slate-50 focus:bg-white" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">GST Number</label>
                      <Input placeholder="e.g. 07AAAAA0000A1Z5" className="bg-slate-50 focus:bg-white font-mono" />
                    </div>
                  </div>
                </StaggerItem>

                {/* Contact Details */}
                <StaggerItem>
                  <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Contact Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Mobile Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Enter mobile number" className="pl-10 bg-slate-50 focus:bg-white" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Enter email address" className="pl-10 bg-slate-50 focus:bg-white" />
                      </div>
                    </div>
                  </div>
                </StaggerItem>

                {/* Location */}
                <StaggerItem>
                  <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Location</h3>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Full Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <textarea 
                        className="w-full min-h-[100px] pl-10 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all resize-none text-sm"
                        placeholder="Enter complete shipping/billing address..."
                      />
                    </div>
                  </div>
                </StaggerItem>

                {/* Submit */}
                <StaggerItem className="pt-4 flex justify-end gap-4 border-t border-slate-100">
                  <Button variant="outline" className="px-6 rounded-xl font-bold">Cancel</Button>
                  <Button className="px-8 rounded-xl font-bold gap-2 bg-brand-primary text-white shadow-lg shadow-brand-primary/20 hover:shadow-xl hover:bg-brand-secondary transition-all">
                    <Save className="h-4 w-4" />
                    Save Lead
                  </Button>
                </StaggerItem>

              </StaggerContainer>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
