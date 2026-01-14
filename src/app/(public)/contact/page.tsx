'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, MessageSquare, Clock, Send, MapPin, HelpCircle, ArrowLeft, User, AtSign, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

export default function ContactPage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const contactMethods = [
    { icon: Mail, title: t('common.email'), description: t('common.generalQuestions'), value: 'contact@piksend.com', href: 'mailto:contact@piksend.com', color: 'bg-indigo-100 text-indigo-600' },
    { icon: MessageSquare, title: t('common.support'), description: t('common.technicalIssues'), value: 'support@piksend.com', href: 'mailto:support@piksend.com', color: 'bg-violet-100 text-violet-600' },
    { icon: HelpCircle, title: t('common.help'), description: t('common.faqAndGuides'), value: t('common.helpCenter'), href: '/help', color: 'bg-emerald-100 text-emerald-600' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSuccess(true);
    setIsLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 relative">
      {/* Decorative Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-violet-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-100/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-12">
        {/* Back Link */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium text-sm mb-8 group transition-colors"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          {t('common.back')}
        </Link>

        {/* Hero Header */}
        <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-2xl p-6 sm:p-8 mb-8 relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-400/20 rounded-full blur-2xl translate-x-1/3 translate-y-1/3" />
          
          <div className="relative">
            <div className="w-14 h-14 mx-auto bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/10 mb-4">
              <MessageSquare size={28} className="text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{t('common.contactUs')}</h1>
            <p className="text-indigo-100/70 text-sm max-w-md mx-auto">
              {t('common.weWillReplyShortly')}
            </p>
          </div>
        </div>

        {/* Contact Methods */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {contactMethods.map((method, index) => (
            <Link 
              key={index} 
              href={method.href}
              className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-xl p-4 hover:border-indigo-300 hover:shadow-lg transition-all group text-center"
            >
              <div className={`w-10 h-10 mx-auto ${method.color} rounded-xl flex items-center justify-center mb-3`}>
                <method.icon size={20} />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">{method.title}</h3>
              <p className="text-xs text-slate-500 mb-2">{method.description}</p>
              <span className="text-xs font-medium text-indigo-600">{method.value}</span>
            </Link>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl overflow-hidden shadow-xl shadow-indigo-500/5">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">{t('common.sendUsMessage')}</h2>
            <p className="text-xs text-slate-500">{t('common.weWillReplyShortly')}</p>
          </div>

          <div className="p-5">
            {isSuccess ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 mx-auto bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                  <CheckCircle2 size={28} className="text-emerald-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{t('common.messageSent')}</h3>
                <p className="text-sm text-slate-500 mb-4">{t('common.weWillReply24h')}</p>
                <button
                  onClick={() => { setIsSuccess(false); setFormData({ name: '', email: '', subject: '', message: '' }); }}
                  className="text-sm text-indigo-600 font-medium hover:underline"
                >
                  {t('common.sendUsMessage')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-0.5">{t('common.name')}</label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1 bg-slate-100 rounded group-focus-within:bg-indigo-100 transition-colors">
                        <User className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all font-medium"
                        placeholder={t('common.yourName')}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-0.5">{t('common.email')}</label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1 bg-slate-100 rounded group-focus-within:bg-indigo-100 transition-colors">
                        <AtSign className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all font-medium"
                        placeholder={t('common.yourEmail')}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-0.5">{t('common.subject')}</label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1 bg-slate-100 rounded group-focus-within:bg-indigo-100 transition-colors">
                      <FileText className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                    </div>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all font-medium"
                      placeholder={t('common.messageSubject')}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-0.5">{t('common.message')}</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all font-medium resize-none"
                    placeholder={t('common.describeRequest')}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>
                      <Send size={14} />
                      <span>{t('common.send')}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="grid sm:grid-cols-2 gap-4 mt-8">
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-xl p-5 text-center">
            <div className="w-10 h-10 mx-auto bg-amber-100 rounded-xl flex items-center justify-center mb-3">
              <Clock size={20} className="text-amber-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">{t('common.responseTime')}</h3>
            <p className="text-xs text-slate-500">{t('common.businessHours24to48')}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-xl p-5 text-center">
            <div className="w-10 h-10 mx-auto bg-rose-100 rounded-xl flex items-center justify-center mb-3">
              <MapPin size={20} className="text-rose-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">{t('common.location')}</h3>
            <p className="text-xs text-slate-500">Kinshasa, Gombe • RD Congo</p>
          </div>
        </div>
      </div>
    </div>
  );
}
