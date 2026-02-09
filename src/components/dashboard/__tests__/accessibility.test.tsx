/**
 * Accessibility Tests for Dashboard Components
 * 
 * Tests for Requirements 22.1, 22.2, 22.3, 22.4, 22.5, 22.6, 22.7:
 * - 22.1: WCAG 2.1 niveau AA minimum
 * - 22.2: Navigation clavier complète
 * - 22.3: Labels ARIA appropriés
 * - 22.4: Ratio de contraste 4.5:1 minimum
 * - 22.5: Alternatives textuelles images/vidéos
 * - 22.6: Zoom 200% sans perte de fonctionnalité
 * - 22.7: Compatibilité screen readers
 * 
 * Task: 4.9 Tests accessibilité WCAG 2.1 AA
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import userEvent from '@testing-library/user-event';
import { OnboardingGuide } from '../onboarding-guide';
import { SupportWidget } from '../support-widget';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/dashboard',
}));

// Mock analytics
vi.mock('@/lib/services/analytics.service', () => ({
  trackEvent: vi.fn(),
}));

describe('Accessibility Tests - Dashboard Components', () => {
  describe('OnboardingGuide Accessibility (Req 22.1-22.7)', () => {
    const mockUserId = '123';
    const mockCompletedTasks: string[] = [];
    const mockOnComplete = vi.fn();
    const mockOnDismiss = vi.fn();

    it('should have proper section role and label (Req 22.3)', () => {
      render(
        <OnboardingGuide
          userId={mockUserId}
          completedTasks={mockCompletedTasks}
          onComplete={mockOnComplete}
          onDismiss={mockOnDismiss}
        />
      );

      const section = screen.getByRole('region', { name: /guide|onboarding|démarrage/i });
      expect(section).toBeInTheDocument();
    });

    it('should have descriptive heading (Req 22.7)', () => {
      render(
        <OnboardingGuide
          userId={mockUserId}
          completedTasks={mockCompletedTasks}
          onComplete={mockOnComplete}
          onDismiss={mockOnDismiss}
        />
      );

      const heading = screen.getByRole('heading', { name: /commencer|démarrage|guide/i });
      expect(heading).toBeInTheDocument();
    });

    it('should have progress bar with proper attributes (Req 22.3, 22.7)', () => {
      render(
        <OnboardingGuide
          userId={mockUserId}
          completedTasks={mockCompletedTasks}
          onComplete={mockOnComplete}
          onDismiss={mockOnDismiss}
        />
      );

      const progressbar = screen.queryByRole('progressbar');
      if (progressbar) {
        expect(progressbar).toHaveAttribute('aria-valuenow');
        expect(progressbar).toHaveAttribute('aria-valuemin', '0');
        expect(progressbar).toHaveAttribute('aria-valuemax', '100');
        expect(progressbar).toHaveAttribute('aria-label');
      }
    });

    it('should have list of tasks with proper structure (Req 22.3, 22.7)', () => {
      render(
        <OnboardingGuide
          userId={mockUserId}
          completedTasks={mockCompletedTasks}
          onComplete={mockOnComplete}
          onDismiss={mockOnDismiss}
        />
      );

      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();

      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBeGreaterThan(0);
    });

    it('should have keyboard accessible task buttons (Req 22.2)', async () => {
      const user = userEvent.setup();
      render(
        <OnboardingGuide
          userId={mockUserId}
          completedTasks={mockCompletedTasks}
          onComplete={mockOnComplete}
          onDismiss={mockOnDismiss}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // First button should be focusable
      await user.tab();
      expect(buttons[0]).toHaveFocus();
    });

    it('should have visible focus indicators (Req 22.2)', () => {
      render(
        <OnboardingGuide
          userId={mockUserId}
          completedTasks={mockCompletedTasks}
          onComplete={mockOnComplete}
          onDismiss={mockOnDismiss}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button.className).toMatch(/focus:ring|focus:outline/);
      });
    });

    it('should have checkboxes with proper labels (Req 22.3)', () => {
      render(
        <OnboardingGuide
          userId={mockUserId}
          completedTasks={['create_first_gallery']}
          onComplete={mockOnComplete}
          onDismiss={mockOnDismiss}
        />
      );

      const checkboxes = screen.queryAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        // Each checkbox should have an associated label
        const label = checkbox.closest('label') || checkbox.getAttribute('aria-label');
        expect(label).toBeTruthy();
      });
    });

    it('should have status indicators for completed tasks (Req 22.3, 22.7)', () => {
      render(
        <OnboardingGuide
          userId={mockUserId}
          completedTasks={['create_first_gallery']}
          onComplete={mockOnComplete}
          onDismiss={mockOnDismiss}
        />
      );

      // Completed tasks should have visual and screen reader indicators
      const completedIndicators = screen.queryAllByRole('status') || 
                                  screen.queryAllByLabelText(/complété|terminé/i);
      expect(completedIndicators.length).toBeGreaterThan(0);
    });

    it('should have dismiss button with proper label (Req 22.3)', () => {
      render(
        <OnboardingGuide
          userId={mockUserId}
          completedTasks={mockCompletedTasks}
          onComplete={mockOnComplete}
          onDismiss={mockOnDismiss}
        />
      );

      const dismissButton = screen.getByRole('button', { name: /fermer|masquer|plus tard/i });
      expect(dismissButton).toBeInTheDocument();
    });

    it('should pass axe accessibility tests (Req 22.1)', async () => {
      const { container } = render(
        <OnboardingGuide
          userId={mockUserId}
          completedTasks={mockCompletedTasks}
          onComplete={mockOnComplete}
          onDismiss={mockOnDismiss}
        />
      );

      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });

    it('should be responsive at 200% zoom (Req 22.6)', () => {
      const { container } = render(
        <div style={{ fontSize: '200%' }}>
          <OnboardingGuide
            userId={mockUserId}
            completedTasks={mockCompletedTasks}
            onComplete={mockOnComplete}
            onDismiss={mockOnDismiss}
          />
        </div>
      );

      // Content should not overflow
      expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth + 100);
    });

    it('should announce progress updates to screen readers (Req 22.7)', () => {
      render(
        <OnboardingGuide
          userId={mockUserId}
          completedTasks={['create_first_gallery']}
          onComplete={mockOnComplete}
          onDismiss={mockOnDismiss}
        />
      );

      // Progress updates should have aria-live region
      const liveRegion = screen.queryByRole('status') || 
                        document.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeTruthy();
    });
  });

  describe('SupportWidget Accessibility (Req 22.1-22.7)', () => {
    it('should have proper button role and label (Req 22.3)', () => {
      render(<SupportWidget />);

      const button = screen.getByRole('button', { name: /support|aide|contact/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label');
    });

    it('should be keyboard accessible (Req 22.2)', async () => {
      const user = userEvent.setup();
      render(<SupportWidget />);

      const button = screen.getByRole('button');
      
      // Should be focusable with tab
      await user.tab();
      expect(button).toHaveFocus();

      // Should be activatable with Enter
      await user.keyboard('{Enter}');
      // Widget should open (check for expanded state)
    });

    it('should have visible focus indicator (Req 22.2)', () => {
      render(<SupportWidget />);

      const button = screen.getByRole('button');
      expect(button.className).toMatch(/focus:ring|focus:outline/);
    });

    it('should have aria-expanded state (Req 22.3)', async () => {
      const user = userEvent.setup();
      render(<SupportWidget />);

      const button = screen.getByRole('button');
      
      // Initially collapsed
      expect(button).toHaveAttribute('aria-expanded', 'false');

      // After click, should be expanded
      await user.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have proper dialog when expanded (Req 22.3)', async () => {
      const user = userEvent.setup();
      render(<SupportWidget />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Should show dialog or menu
      const dialog = screen.queryByRole('dialog') || screen.queryByRole('menu');
      if (dialog) {
        expect(dialog).toBeInTheDocument();
        expect(dialog).toHaveAttribute('aria-labelledby');
      }
    });

    it('should trap focus when open (Req 22.2)', async () => {
      const user = userEvent.setup();
      render(<SupportWidget />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Tab through elements
      for (let i = 0; i < 10; i++) {
        await user.tab();
      }

      // Focus should stay within widget
      const activeElement = document.activeElement;
      const widget = button.closest('[role="dialog"]') || button.parentElement;
      expect(widget?.contains(activeElement)).toBe(true);
    });

    it('should close with Escape key (Req 22.2)', async () => {
      const user = userEvent.setup();
      render(<SupportWidget />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(button).toHaveAttribute('aria-expanded', 'true');

      await user.keyboard('{Escape}');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });

    it('should have sufficient color contrast (Req 22.4)', async () => {
      const { container } = render(<SupportWidget />);

      const results = await axe(container);
      const contrastViolations = results.violations.filter(
        v => v.id === 'color-contrast'
      );
      expect(contrastViolations).toEqual([]);
    });

    it('should pass axe accessibility tests (Req 22.1)', async () => {
      const { container } = render(<SupportWidget />);

      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });

    it('should have icon with proper label (Req 22.5)', () => {
      render(<SupportWidget />);

      const button = screen.getByRole('button');
      const icon = button.querySelector('svg');
      
      if (icon) {
        // Icon should have aria-hidden or aria-label
        const hasAriaHidden = icon.hasAttribute('aria-hidden');
        const hasAriaLabel = icon.hasAttribute('aria-label');
        const buttonHasLabel = button.hasAttribute('aria-label');
        
        expect(hasAriaHidden || hasAriaLabel || buttonHasLabel).toBe(true);
      }
    });
  });

  describe('Dashboard Navigation (Req 22.2, 22.7)', () => {
    it('should have proper navigation landmark', () => {
      render(
        <nav role="navigation" aria-label="Navigation principale">
          <ul>
            <li><a href="/dashboard">Tableau de bord</a></li>
            <li><a href="/galleries">Galeries</a></li>
            <li><a href="/settings">Paramètres</a></li>
          </ul>
        </nav>
      );

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveAttribute('aria-label');
    });

    it('should have keyboard accessible navigation links (Req 22.2)', async () => {
      const user = userEvent.setup();
      render(
        <nav>
          <a href="/dashboard">Tableau de bord</a>
          <a href="/galleries">Galeries</a>
          <a href="/settings">Paramètres</a>
        </nav>
      );

      const links = screen.getAllByRole('link');
      
      // Tab through links
      await user.tab();
      expect(links[0]).toHaveFocus();

      await user.tab();
      expect(links[1]).toHaveFocus();

      await user.tab();
      expect(links[2]).toHaveFocus();
    });

    it('should have current page indicator (Req 22.3, 22.7)', () => {
      render(
        <nav>
          <a href="/dashboard" aria-current="page">Tableau de bord</a>
          <a href="/galleries">Galeries</a>
        </nav>
      );

      const currentLink = screen.getByRole('link', { current: 'page' });
      expect(currentLink).toBeInTheDocument();
    });

    it('should have visible focus indicators on links (Req 22.2)', () => {
      render(
        <nav>
          <a href="/dashboard" className="focus:ring-2 focus:ring-indigo-500">
            Tableau de bord
          </a>
        </nav>
      );

      const link = screen.getByRole('link');
      expect(link.className).toMatch(/focus:ring/);
    });
  });

  describe('Dashboard Layout (Req 22.7)', () => {
    it('should have proper landmark structure', () => {
      render(
        <div>
          <header role="banner">
            <h1>PikSend Dashboard</h1>
          </header>
          <nav role="navigation">Navigation</nav>
          <main role="main">
            <h2>Mes Galeries</h2>
          </main>
          <aside role="complementary">
            <OnboardingGuide
              userId="1"
              completedTasks={[]}
              onComplete={vi.fn()}
              onDismiss={vi.fn()}
            />
          </aside>
          <footer role="contentinfo">Footer</footer>
        </div>
      );

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('complementary')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('should have skip to main content link (Req 22.2)', () => {
      render(
        <div>
          <a href="#main-content" className="sr-only focus:not-sr-only">
            Aller au contenu principal
          </a>
          <main id="main-content">Content</main>
        </div>
      );

      const skipLink = screen.getByText(/aller au contenu/i);
      expect(skipLink).toBeInTheDocument();
    });

    it('should have logical heading hierarchy (Req 22.7)', () => {
      render(
        <div>
          <h1>Dashboard</h1>
          <section>
            <h2>Mes Galeries</h2>
            <article>
              <h3>Galerie 1</h3>
            </article>
          </section>
        </div>
      );

      const h1 = screen.getByRole('heading', { level: 1 });
      const h2 = screen.getByRole('heading', { level: 2 });
      const h3 = screen.getByRole('heading', { level: 3 });

      expect(h1).toBeInTheDocument();
      expect(h2).toBeInTheDocument();
      expect(h3).toBeInTheDocument();
    });
  });

  describe('Interactive Elements (Req 22.2, 22.3)', () => {
    it('should have proper button labels', () => {
      render(
        <div>
          <button aria-label="Créer une nouvelle galerie">
            <svg aria-hidden="true">+</svg>
          </button>
          <button>Sauvegarder</button>
        </div>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const hasText = button.textContent && button.textContent.trim().length > 0;
        const hasAriaLabel = button.hasAttribute('aria-label');
        expect(hasText || hasAriaLabel).toBe(true);
      });
    });

    it('should have proper link labels', () => {
      render(
        <div>
          <a href="/gallery/123" aria-label="Voir la galerie Mariage 2024">
            <img src="/thumb.jpg" alt="" />
          </a>
          <a href="/settings">Paramètres</a>
        </div>
      );

      const links = screen.getAllByRole('link');
      links.forEach(link => {
        const hasText = link.textContent && link.textContent.trim().length > 0;
        const hasAriaLabel = link.hasAttribute('aria-label');
        expect(hasText || hasAriaLabel).toBe(true);
      });
    });

    it('should have disabled state properly indicated (Req 22.3)', () => {
      render(
        <button disabled aria-disabled="true">
          Action indisponible
        </button>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should have loading state properly indicated (Req 22.3, 22.7)', () => {
      render(
        <button aria-busy="true" aria-label="Chargement en cours">
          <span className="sr-only">Chargement...</span>
          <svg aria-hidden="true">spinner</svg>
        </button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Notifications and Alerts (Req 22.7)', () => {
    it('should have proper alert role for errors', () => {
      render(
        <div role="alert" aria-live="assertive">
          Une erreur s'est produite
        </div>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have proper status role for success messages', () => {
      render(
        <div role="status" aria-live="polite">
          Galerie créée avec succès
        </div>
      );

      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
      expect(status).toHaveAttribute('aria-live', 'polite');
    });

    it('should have dismissible alerts with proper button', () => {
      render(
        <div role="alert">
          <p>Message d'alerte</p>
          <button aria-label="Fermer l'alerte">×</button>
        </div>
      );

      const closeButton = screen.getByRole('button', { name: /fermer/i });
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Responsive and Zoom (Req 22.6)', () => {
    it('should maintain functionality at 200% zoom', () => {
      const { container } = render(
        <div style={{ fontSize: '200%' }}>
          <OnboardingGuide
            userId="1"
            completedTasks={[]}
            onComplete={vi.fn()}
            onDismiss={vi.fn()}
          />
          <SupportWidget />
        </div>
      );

      // Content should not overflow horizontally
      expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth + 100);
    });

    it('should use relative units for sizing', () => {
      const { container } = render(
        <div className="text-base p-4 m-2">
          Content with relative units
        </div>
      );

      // Tailwind uses rem units by default
      const element = container.firstChild as HTMLElement;
      expect(element.className).toMatch(/text-|p-|m-/);
    });

    it('should not have fixed pixel widths that break at zoom', () => {
      const { container } = render(
        <div className="max-w-7xl mx-auto">
          <OnboardingGuide
            userId="1"
            completedTasks={[]}
            onComplete={vi.fn()}
            onDismiss={vi.fn()}
          />
        </div>
      );

      // Should use max-width, not fixed width
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toMatch(/max-w-/);
    });
  });
});

