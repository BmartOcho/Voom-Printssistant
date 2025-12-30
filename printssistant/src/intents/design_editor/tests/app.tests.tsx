/* eslint-disable formatjs/no-literal-string-in-jsx */
import { useFeatureSupport } from '@canva/app-hooks';
import { TestAppI18nProvider } from '@canva/app-i18n-kit';
import { TestAppUiProvider } from '@canva/app-ui-kit';
import { getCurrentPageContext } from '@canva/design';
import { fireEvent, render, waitFor } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import type { ReactNode } from 'react';
import { App } from '../app';

// Mock the hooks and SDK functions
jest.mock('@canva/app-hooks');
jest.mock('@canva/design');

function renderInTestProvider(node: ReactNode): RenderResult {
  return render(
    <TestAppI18nProvider>
      <TestAppUiProvider>{node}</TestAppUiProvider>
    </TestAppI18nProvider>
  );
}

describe('Printssistant App Tests', () => {
  const mockIsSupported = jest.fn();
  const mockUseFeatureSupport = jest.mocked(useFeatureSupport);
  const mockGetCurrentPageContext = jest.mocked(getCurrentPageContext);

  beforeEach(() => {
    jest.resetAllMocks();
    mockIsSupported.mockReturnValue(true);
    mockUseFeatureSupport.mockReturnValue(mockIsSupported);
    
    // Mock page context with business card size (3.5" x 2" = 252pt x 144pt)
    mockGetCurrentPageContext.mockResolvedValue({
      dimensions: {
        width: 252, // 3.5 inches in points (72pt/in)
        height: 144, // 2 inches in points
      },
    } as Awaited<ReturnType<typeof getCurrentPageContext>>);
  });

  describe('Navigation Flow', () => {
    it('should show welcome view by default', () => {
      const result = renderInTestProvider(<App />);
      
      // Check for welcome screen elements
      expect(result.getByText('Printssistant')).toBeInTheDocument();
      expect(result.getByText('Get Started')).toBeInTheDocument();
    });

    it('should navigate from welcome to job-select when clicking Get Started', async () => {
      const result = renderInTestProvider(<App />);
      
      // Click Get Started
      const getStartedBtn = result.getByText('Get Started');
      fireEvent.click(getStartedBtn);

      // Wait for job selector to appear
      await waitFor(() => {
        expect(result.getByText('Select Print Job')).toBeInTheDocument();
      });
    });

    it('should navigate from job-select to main when selecting a job', async () => {
      const result = renderInTestProvider(<App />);
      
      // Go to job select
      fireEvent.click(result.getByText('Get Started'));
      
      await waitFor(() => {
        expect(result.getByText('Select Print Job')).toBeInTheDocument();
      });

      // Find and click a job (Business Card should match our mock dimensions)
      const businessCardBtn = result.getByText(/Business Card/);
      fireEvent.click(businessCardBtn);

      // Should now show main view with progress
      await waitFor(() => {
        expect(result.getByText('Progress')).toBeInTheDocument();
      });
    });

    it('should navigate back from job-select to welcome', async () => {
      const result = renderInTestProvider(<App />);
      
      // Go to job select
      fireEvent.click(result.getByText('Get Started'));
      
      await waitFor(() => {
        expect(result.getByText('Select Print Job')).toBeInTheDocument();
      });

      // Click back button
      fireEvent.click(result.getByText('← Back'));

      // Should be back at welcome
      await waitFor(() => {
        expect(result.getByText('Get Started')).toBeInTheDocument();
      });
    });
  });

  describe('Size Matching', () => {
    it('should show size match indicator for matching dimensions', async () => {
      const result = renderInTestProvider(<App />);
      
      // Go to job select
      fireEvent.click(result.getByText('Get Started'));
      
      await waitFor(() => {
        // Business Card (3.5" x 2") should show match indicator ✓
        const businessCardBtn = result.getByText(/Business Card.*✓/);
        expect(businessCardBtn).toBeInTheDocument();
      });
    });

    it('should show size mismatch warning when dimensions do not match', async () => {
      // Mock with different dimensions
      mockGetCurrentPageContext.mockResolvedValue({
        dimensions: {
          width: 612, // 8.5 inches
          height: 792, // 11 inches
        },
      } as Awaited<ReturnType<typeof getCurrentPageContext>>);

      const result = renderInTestProvider(<App />);
      
      // Go to job select
      fireEvent.click(result.getByText('Get Started'));
      
      await waitFor(() => {
        expect(result.getByText('Select Print Job')).toBeInTheDocument();
      });

      // Select business card (will mismatch)
      const businessCardBtn = result.getByText(/Business Card/);
      fireEvent.click(businessCardBtn);

      // Should show mismatch warning in main view
      await waitFor(() => {
        expect(
          result.getByText(/doesn't match/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Checklist and Progress', () => {
    it('should track check completion and update progress', async () => {
      const result = renderInTestProvider(<App />);
      
      // Navigate to main view
      fireEvent.click(result.getByText('Get Started'));
      await waitFor(() => expect(result.getByText('Select Print Job')).toBeInTheDocument());
      fireEvent.click(result.getByText(/Business Card/));
      await waitFor(() => expect(result.getByText('Progress')).toBeInTheDocument());

      // Initially 0/2 required
      expect(result.getByText(/0\/2/)).toBeInTheDocument();

      // Complete the Bleed Check
      const bleedCheck = result.getByLabelText(/Bleed Check/i);
      fireEvent.click(bleedCheck);

      // Progress should update to 1/2
      await waitFor(() => {
        expect(result.getByText(/1\/2/)).toBeInTheDocument();
      });
    });

    it('should show success state when all required checks are complete', async () => {
      const result = renderInTestProvider(<App />);
      
      // Navigate to main view
      fireEvent.click(result.getByText('Get Started'));
      await waitFor(() => expect(result.getByText('Select Print Job')).toBeInTheDocument());
      fireEvent.click(result.getByText(/Business Card/));
      await waitFor(() => expect(result.getByText('Progress')).toBeInTheDocument());

      // Complete both required checks
      const bleedCheck = result.getByLabelText(/Bleed Check/i);
      const safeZoneCheck = result.getByLabelText(/Safe Zone Check/i);
      
      fireEvent.click(bleedCheck);
      fireEvent.click(safeZoneCheck);

      // Should show success state
      await waitFor(() => {
        expect(result.getByText('Ready for Print!')).toBeInTheDocument();
      });
    });
  });

  describe('Snapshot', () => {
    it('should have a consistent welcome view snapshot', () => {
      const result = renderInTestProvider(<App />);
      expect(result.container).toMatchSnapshot();
    });
  });
});
