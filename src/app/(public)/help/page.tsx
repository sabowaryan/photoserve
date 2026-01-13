import { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { MarkdownContent } from '@/components/shared/markdown-content';
import { generatePageMetadata } from '@/lib/services';
import { HelpCircle, ArrowLeft, BookOpen, MessageCircle, Mail } from 'lucide-react';

export const metadata: Metadata = generatePageMetadata('help');

function getHelpContent(): string {
  const filePath = path.join(process.cwd(), 'src', 'content', 'help.md');
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

export default function HelpPage() {
  const content = getHelpContent();

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
          Retour à l&apos;accueil
        </Link>

        {/* Hero Header */}
        <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-2xl p-6 sm:p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-400/20 rounded-full blur-2xl translate-x-1/3 translate-y-1/3" />
          
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/10">
              <HelpCircle size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Centre d&apos;aide</h1>
              <p className="text-indigo-100/70 text-sm">Trouvez des réponses à vos questions</p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Link href="/contact" className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-xl p-4 hover:border-indigo-300 hover:shadow-lg transition-all group">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors">
              <MessageCircle size={20} className="text-indigo-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Nous contacter</h3>
            <p className="text-xs text-slate-500">Envoyez-nous un message</p>
          </Link>
          <Link href="/legal/terms" className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-xl p-4 hover:border-indigo-300 hover:shadow-lg transition-all group">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-violet-200 transition-colors">
              <BookOpen size={20} className="text-violet-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Conditions</h3>
            <p className="text-xs text-slate-500">Termes d&apos;utilisation</p>
          </Link>
          <a href="mailto:support@piksend.com" className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-xl p-4 hover:border-indigo-300 hover:shadow-lg transition-all group">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-emerald-200 transition-colors">
              <Mail size={20} className="text-emerald-600" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Support</h3>
            <p className="text-xs text-slate-500">support@piksend.com</p>
          </a>
        </div>

        {/* Content Card */}
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 sm:p-8 shadow-xl shadow-indigo-500/5">
          <MarkdownContent content={content} />
        </div>
      </div>
    </div>
  );
}
