import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getFeaturesContent } from '@/lib/content/features';
import { generatePageMetadata } from '@/lib/services';
import { 
  Shield, 
  Clock, 
  Download, 
  Lock,
  Globe,
  Zap,
  Image,
  Eye,
  Smartphone,
  Cloud,
  ChevronRight,
  AlertTriangle,
  Check
} from 'lucide-react';

// Icon mapping
const iconMap = {
  Shield,
  Clock,
  Download,
  Lock,
  Globe,
  Zap,
  Image,
  Eye,
  Smartphone,
  Cloud,
} as const;

// Use centralized SEO service for metadata
export const metadata: Metadata = generatePageMetadata('features');

export default function FeaturesPage() {
  const content = getFeaturesContent();

  return (
    <>
      {/* Hero */}
      <section className="pt-16 pb-16 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="outline" className="mb-4 border-primary/50 text-primary">
            {content.hero.badge}
          </Badge>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">
            {content.hero.title}<br />
            <span className="gradient-text">{content.hero.titleHighlight}</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {content.hero.subtitle}
          </p>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-12 px-4 bg-card/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="font-display text-2xl font-bold text-center mb-8">
            {content.comparison.title}
          </h2>
          <Card className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium"></th>
                    <th className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        WhatsApp
                      </div>
                    </th>
                    <th className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-primary">
                        <Check className="h-4 w-4" />
                        PikSend
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {content.comparison.items.map((row, index) => (
                    <tr key={index} className="border-b border-border/50 last:border-0">
                      <td className="p-4 font-medium text-sm">{row.feature}</td>
                      <td className="p-4 text-center text-sm text-muted-foreground">{row.whatsapp}</td>
                      <td className="p-4 text-center text-sm text-primary font-medium">{row.photoserve}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="font-display text-3xl font-bold text-center mb-12">
            {content.mainFeatures.title}
          </h2>
          <div className="grid lg:grid-cols-2 gap-8">
            {content.mainFeatures.items.map((feature, index) => {
              const Icon = iconMap[feature.icon as keyof typeof iconMap] || Shield;
              return (
                <Card key={index} className="glass-card">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      <Badge variant="outline" className="text-xs">{feature.highlight}</Badge>
                    </div>
                    <CardTitle className="font-display text-2xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.details.map((detail, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-primary shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-16 px-4 bg-card/30">
        <div className="container mx-auto">
          <h2 className="font-display text-3xl font-bold text-center mb-12">
            {content.additionalFeatures.title}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.additionalFeatures.items.map((feature, index) => {
              const Icon = iconMap[feature.icon as keyof typeof iconMap] || Shield;
              return (
                <Card key={index} className="glass-card hover:border-primary/50 transition-all">
                  <CardHeader>
                    <div className="p-2 rounded-lg bg-primary/10 w-fit mb-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="font-display text-3xl font-bold mb-4">
            {content.cta.title}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            {content.cta.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="btn-primary">
              <Link href="/auth">
                {content.cta.button}
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            {content.cta.footer}
          </p>
        </div>
      </section>
    </>
  );
}
