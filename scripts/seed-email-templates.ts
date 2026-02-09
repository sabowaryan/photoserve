/**
 * Seed Email Templates Script
 * Inserts email templates for conversion funnel into database
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/lib/supabase/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Template definitions
const templates = [
  {
    name: 'Email de Bienvenue',
    slug: 'welcome-email',
    type: 'transactional' as const,
    source: 'custom' as const,
    subject: 'Bienvenue sur PikSend ! 🎉',
    variables: ['firstName', 'email'],
    content: {
      html: `<!-- Welcome email HTML will be added via append -->`,
    },
  },
  {
    name: 'Rappel Première Galerie - J+1',
    slug: 'first-gallery-reminder-d1',
    type: 'marketing' as const,
    source: 'custom' as const,
    subject: 'Comment créer votre première galerie',
    variables: ['firstName', 'email'],
    content: {
      html: `<!-- First gallery reminder HTML will be added via append -->`,
    },
  },
];

async function seedTemplates() {
  console.log('Starting email templates seed...');

  
  for (const template of templates) {
    console.log(`Inserting template: ${template.name}`);
    
    const { data, error } = await supabase
      .from('email_templates')
      .upsert(
        {
          slug: template.slug,
          name: template.name,
          type: template.type,
          source: template.source,
          subject: template.subject,
          variables: template.variables,
          content: template.content,
          is_active: true,
          active_version: 1,
        },
        {
          onConflict: 'slug',
        }
      )
      .select()
      .single();
    
    if (error) {
      console.error(`Error inserting template ${template.name}:`, error);
      continue;
    }
    
    console.log(`✓ Template ${template.name} inserted with ID: ${data.id}`);
  }
  
  console.log('Email templates seed completed!');
}

seedTemplates().catch(console.error);
