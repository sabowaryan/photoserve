import { Link, useParams } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, ArrowLeft } from 'lucide-react';

const legalContent = {
  terms: {
    title: "Conditions Générales d'Utilisation",
    lastUpdated: '1er janvier 2025',
    content: [
      {
        title: '1. Objet',
        text: "Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités d'accès et d'utilisation des services proposés par PhotoServe. En accédant au service, vous acceptez sans réserve les présentes CGU.",
      },
      {
        title: '2. Description du service',
        text: "PhotoServe est une plateforme permettant aux photographes professionnels de créer des galeries photo temporaires et sécurisées par mot de passe, afin de partager leurs travaux avec leurs clients. Le service propose différentes formules d'abonnement avec des fonctionnalités et limites variables.",
      },
      {
        title: '3. Inscription et compte utilisateur',
        text: "L'accès au service nécessite la création d'un compte utilisateur. Vous êtes responsable de la confidentialité de vos identifiants et de toutes les activités effectuées depuis votre compte. Vous vous engagez à fournir des informations exactes et à les maintenir à jour.",
      },
      {
        title: '4. Utilisation du service',
        text: "Vous vous engagez à utiliser le service conformément à sa destination et dans le respect des lois en vigueur. Il est notamment interdit de : diffuser des contenus illicites, porter atteinte aux droits de tiers, utiliser le service à des fins frauduleuses.",
      },
      {
        title: '5. Propriété intellectuelle',
        text: "Vous conservez l'intégralité des droits de propriété intellectuelle sur les contenus que vous uploadez. PhotoServe dispose d'une licence limitée pour stocker et diffuser vos contenus dans le cadre du service.",
      },
      {
        title: '6. Responsabilité',
        text: "PhotoServe s'engage à mettre en œuvre tous les moyens raisonnables pour assurer la disponibilité et la sécurité du service. Toutefois, PhotoServe ne saurait être tenu responsable des dommages indirects résultant de l'utilisation du service.",
      },
      {
        title: '7. Résiliation',
        text: "Vous pouvez résilier votre compte à tout moment depuis les paramètres de votre compte. PhotoServe se réserve le droit de suspendre ou résilier un compte en cas de violation des présentes CGU.",
      },
      {
        title: '8. Modification des CGU',
        text: "PhotoServe se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification par email ou notification dans l'application.",
      },
    ],
  },
  privacy: {
    title: 'Politique de Confidentialité',
    lastUpdated: '1er janvier 2025',
    content: [
      {
        title: '1. Collecte des données',
        text: "Nous collectons les données que vous nous fournissez directement : adresse email, nom, photos uploadées. Nous collectons également des données de navigation (adresse IP, type de navigateur) à des fins d'amélioration du service.",
      },
      {
        title: '2. Utilisation des données',
        text: "Vos données sont utilisées pour : fournir et améliorer le service, gérer votre compte, vous contacter concernant votre utilisation du service, respecter nos obligations légales.",
      },
      {
        title: '3. Partage des données',
        text: "Nous ne vendons pas vos données personnelles. Nous pouvons partager vos données avec des prestataires techniques (hébergement, paiement) dans le cadre strict de la fourniture du service.",
      },
      {
        title: '4. Stockage et sécurité',
        text: "Vos données sont stockées sur des serveurs sécurisés. Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé.",
      },
      {
        title: '5. Conservation des données',
        text: "Vos données personnelles sont conservées pendant la durée de votre utilisation du service, puis archivées pendant la durée légale applicable. Les photos des galeries sont supprimées après leur date d'expiration.",
      },
      {
        title: '6. Vos droits',
        text: "Conformément au RGPD, vous disposez des droits suivants : accès, rectification, effacement, opposition, limitation, portabilité. Pour exercer ces droits, contactez-nous à privacy@photoserve.fr.",
      },
      {
        title: '7. Transferts internationaux',
        text: "Vos données peuvent être transférées vers des pays hors UE dans le cadre de l'utilisation de certains prestataires. Ces transferts sont encadrés par des garanties appropriées (clauses contractuelles types).",
      },
    ],
  },
  cookies: {
    title: 'Politique des Cookies',
    lastUpdated: '1er janvier 2025',
    content: [
      {
        title: "1. Qu'est-ce qu'un cookie ?",
        text: "Un cookie est un petit fichier texte déposé sur votre terminal lors de la visite d'un site web. Il permet de stocker des informations relatives à votre navigation.",
      },
      {
        title: '2. Cookies utilisés',
        text: "Nous utilisons les types de cookies suivants : cookies essentiels (nécessaires au fonctionnement du site), cookies de session (authentification), cookies analytiques (amélioration du service).",
      },
      {
        title: '3. Cookies essentiels',
        text: "Ces cookies sont indispensables au fonctionnement du site et ne peuvent pas être désactivés. Ils permettent notamment de maintenir votre session de connexion.",
      },
      {
        title: '4. Cookies analytiques',
        text: "Ces cookies nous permettent de comprendre comment les visiteurs utilisent notre site, afin d'améliorer son fonctionnement et votre expérience.",
      },
      {
        title: '5. Gestion des cookies',
        text: "Vous pouvez à tout moment modifier vos préférences en matière de cookies via les paramètres de votre navigateur. Notez que le blocage de certains cookies peut affecter le fonctionnement du site.",
      },
      {
        title: '6. Durée de conservation',
        text: "Les cookies de session sont supprimés à la fermeture de votre navigateur. Les autres cookies sont conservés pour une durée maximale de 13 mois.",
      },
    ],
  },
  mentions: {
    title: 'Mentions Légales',
    lastUpdated: '1er janvier 2025',
    content: [
      {
        title: '1. Éditeur du site',
        text: "PhotoServe SAS, société par actions simplifiée au capital de 10 000 euros. Siège social : 123 Rue de la Photo, 75001 Paris, France. RCS Paris 123 456 789. N° TVA : FR12345678901. Directeur de la publication : Jean Photographe.",
      },
      {
        title: '2. Hébergement',
        text: "Le site est hébergé par : Supabase Inc., 970 Toa Payoh North #07-04, Singapore 318992. Les données sont stockées sur des serveurs situés dans l'Union Européenne.",
      },
      {
        title: '3. Contact',
        text: "Pour toute question ou réclamation, vous pouvez nous contacter : par email à contact@photoserve.fr, par courrier à l'adresse du siège social mentionnée ci-dessus.",
      },
      {
        title: '4. Propriété intellectuelle',
        text: "L'ensemble des éléments du site (textes, graphismes, logos, icônes, images, logiciels) est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.",
      },
      {
        title: '5. Données personnelles',
        text: "Conformément à la loi Informatique et Libertés du 6 janvier 1978 modifiée et au RGPD, vous disposez de droits sur vos données personnelles. Pour plus d'informations, consultez notre Politique de Confidentialité.",
      },
      {
        title: '6. Médiation',
        text: "En cas de litige, vous pouvez recourir gratuitement au service de médiation. Le médiateur de la consommation compétent est : [Nom du médiateur], joignable à [adresse du médiateur].",
      },
    ],
  },
};

export default function Legal() {
  const { page } = useParams<{ page: string }>();
  const content = legalContent[page as keyof typeof legalContent];
  
  useDocumentTitle(content?.title || 'Page légale');

  if (!content) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="glass-card max-w-md text-center">
          <CardContent className="py-12">
            <h1 className="text-2xl font-bold mb-4">Page non trouvée</h1>
            <Button asChild>
              <Link to="/">Retour à l'accueil</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/20">
                <Camera className="h-5 w-5 text-primary" />
              </div>
              <span className="font-display text-xl font-bold gradient-text">PhotoServe</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="font-display text-2xl sm:text-3xl">{content.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Dernière mise à jour : {content.lastUpdated}
              </p>
            </CardHeader>
            <CardContent className="space-y-8">
              {content.content.map((section, index) => (
                <div key={index}>
                  <h2 className="font-semibold text-lg mb-3">{section.title}</h2>
                  <p className="text-muted-foreground leading-relaxed">{section.text}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {Object.entries(legalContent).map(([key, value]) => (
              <Link
                key={key}
                to={`/legal/${key}`}
                className={`text-sm transition-colors ${
                  key === page ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {value.title}
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Camera className="h-4 w-4" />
            <span className="font-display font-medium">PhotoServe</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}