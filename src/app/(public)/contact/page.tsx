import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { generatePageMetadata } from '@/lib/services';
import { Mail, MessageSquare, Clock, Send, MapPin, HelpCircle } from 'lucide-react';

export const metadata: Metadata = generatePageMetadata('contact');

const contactMethods = [
  { icon: Mail, title: 'Email', description: 'Questions générales', value: 'contact@piksend.com', href: 'mailto:contact@piksend.com' },
  { icon: MessageSquare, title: 'Support', description: 'Problèmes techniques', value: 'support@piksend.com', href: 'mailto:support@piksend.com' },
  { icon: HelpCircle, title: 'Aide', description: 'FAQ et guides', value: 'Centre d\'aide', href: '/help' },
];

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-16 pb-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6">Contactez-nous</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Une question, une suggestion ou besoin d'aide ? Notre équipe est là pour vous.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {contactMethods.map((method, index) => (
              <Card key={index} className="glass-card hover:border-primary/50 transition-all text-center">
                <CardHeader>
                  <div className="mx-auto p-3 rounded-xl bg-primary/10 w-fit mb-2">
                    <method.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{method.title}</CardTitle>
                  <CardDescription className="text-sm">{method.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <a href={method.href} className="text-primary hover:underline font-medium text-sm">
                    {method.value}
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-display text-2xl">Envoyez-nous un message</CardTitle>
              <CardDescription>Nous vous répondrons dans les plus brefs délais.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom</Label>
                    <Input id="name" placeholder="Votre nom" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="votre@email.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Sujet</Label>
                  <Input id="subject" placeholder="Objet de votre message" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <textarea 
                    id="message" 
                    rows={5}
                    placeholder="Décrivez votre demande..."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
                <Button type="submit" className="w-full btn-primary">
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Info */}
      <section className="py-16 px-4 bg-card/30">
        <div className="container mx-auto max-w-2xl">
          <div className="grid sm:grid-cols-2 gap-8 text-center">
            <div>
              <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Temps de réponse</h3>
              <p className="text-sm text-muted-foreground">24 à 48 heures ouvrées</p>
            </div>
            <div>
              <div className="inline-flex p-3 rounded-xl bg-primary/10 mb-4">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Localisation</h3>
              <p className="text-sm text-muted-foreground">Kinshasa, Gombe<br />RD Congo</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
