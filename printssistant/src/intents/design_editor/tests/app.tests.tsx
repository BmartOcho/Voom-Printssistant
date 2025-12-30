import { useFeatureSupport } from "@canva/app-hooks";
import { TestAppI18nProvider } from "@canva/app-i18n-kit";
import { TestAppUiProvider } from "@canva/app-ui-kit";
import { getCurrentPageContext, requestExport } from "@canva/design";
import { requestOpenExternalUrl } from "@canva/platform";
import { fireEvent, render, waitFor } from "@testing-library/react";
import type { RenderResult } from "@testing-library/react";
import type { ReactNode } from "react";
import { App } from "../app";

// Mock the hooks and SDK functions
jest.mock("@canva/app-hooks");
jest.mock("@canva/design");
jest.mock("@canva/platform");

function renderInTestProvider(node: ReactNode): RenderResult {
  return render(
    <TestAppI18nProvider>
      <TestAppUiProvider>{node}</TestAppUiProvider>
    </TestAppI18nProvider>,
  );
}

describe("Printssistant App Tests", () => {
  const mockIsSupported = jest.fn();
  const mockUseFeatureSupport = jest.mocked(useFeatureSupport);
  const mockGetCurrentPageContext = jest.mocked(getCurrentPageContext);
  const mockRequestExport = jest.mocked(requestExport);
  const mockRequestOpenExternalUrl = jest.mocked(requestOpenExternalUrl);

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

    // Mock export
    mockRequestExport.mockResolvedValue({
      status: "completed",
      title: "Test Design",
      exportBlobs: [{ url: "https://example.com/file.pdf" }],
    } as Awaited<ReturnType<typeof requestExport>>);

    // Mock open URL
    mockRequestOpenExternalUrl.mockResolvedValue({ status: "completed" });
  });

  describe("Navigation Flow", () => {
    it("should show welcome view by default", () => {
      const result = renderInTestProvider(<App />);

      expect(result.getByText("Printssistant")).toBeTruthy();
      expect(result.getByText("Get Started")).toBeTruthy();
    });

    it("should navigate from welcome to job-select when clicking Get Started", async () => {
      const result = renderInTestProvider(<App />);

      fireEvent.click(result.getByText("Get Started"));

      await waitFor(() => {
        expect(result.getByText("Select Print Job")).toBeTruthy();
      });
    });

    it("should navigate from job-select to main when selecting a job", async () => {
      const result = renderInTestProvider(<App />);

      fireEvent.click(result.getByText("Get Started"));

      await waitFor(() => {
        expect(result.getByText("Select Print Job")).toBeTruthy();
      });

      const businessCardBtn = result.getByText(/Business Card/);
      fireEvent.click(businessCardBtn);

      await waitFor(() => {
        expect(result.getByText("Getting Print Ready")).toBeTruthy();
      });
    });

    it("should navigate back from job-select to welcome", async () => {
      const result = renderInTestProvider(<App />);

      fireEvent.click(result.getByText("Get Started"));

      await waitFor(() => {
        expect(result.getByText("Select Print Job")).toBeTruthy();
      });

      fireEvent.click(result.getByText("← Back"));

      await waitFor(() => {
        expect(result.getByText("Get Started")).toBeTruthy();
      });
    });
  });

  describe("Size Matching", () => {
    it("should show size match confirmation for matching dimensions", async () => {
      const result = renderInTestProvider(<App />);

      fireEvent.click(result.getByText("Get Started"));
      await waitFor(() =>
        expect(result.getByText("Select Print Job")).toBeTruthy(),
      );

      const businessCardBtn = result.getByText(/Business Card/);
      fireEvent.click(businessCardBtn);

      await waitFor(() => {
        expect(result.getByText(/Design size matches/)).toBeTruthy();
      });
    });

    it("should show size mismatch warning when dimensions do not match", async () => {
      mockGetCurrentPageContext.mockResolvedValue({
        dimensions: {
          width: 612, // 8.5 inches
          height: 792, // 11 inches
        },
      } as Awaited<ReturnType<typeof getCurrentPageContext>>);

      const result = renderInTestProvider(<App />);

      fireEvent.click(result.getByText("Get Started"));
      await waitFor(() =>
        expect(result.getByText("Select Print Job")).toBeTruthy(),
      );

      const businessCardBtn = result.getByText(/Business Card/);
      fireEvent.click(businessCardBtn);

      await waitFor(() => {
        expect(
          result.getByText(/Design size may need adjustment/),
        ).toBeTruthy();
      });
    });
  });

  describe("Checklist and Progress", () => {
    it("should track check completion and update progress", async () => {
      const result = renderInTestProvider(<App />);

      fireEvent.click(result.getByText("Get Started"));
      await waitFor(() =>
        expect(result.getByText("Select Print Job")).toBeTruthy(),
      );
      fireEvent.click(result.getByText(/Business Card/));
      await waitFor(() =>
        expect(result.getByText("Getting Print Ready")).toBeTruthy(),
      );

      expect(result.getByText(/0\/2/)).toBeTruthy();

      const bleedCheck = result.getByLabelText(/Bleed Area/i);
      fireEvent.click(bleedCheck);

      await waitFor(() => {
        expect(result.getByText(/1\/2/)).toBeTruthy();
      });
    });

    it("should show success state when all required checks are complete", async () => {
      const result = renderInTestProvider(<App />);

      fireEvent.click(result.getByText("Get Started"));
      await waitFor(() =>
        expect(result.getByText("Select Print Job")).toBeTruthy(),
      );
      fireEvent.click(result.getByText(/Business Card/));
      await waitFor(() =>
        expect(result.getByText("Getting Print Ready")).toBeTruthy(),
      );

      const bleedCheck = result.getByLabelText(/Bleed Area/i);
      const safeZoneCheck = result.getByLabelText(/Safe Zone/i);

      fireEvent.click(bleedCheck);
      fireEvent.click(safeZoneCheck);

      await waitFor(() => {
        expect(result.getByText("Ready for Print!")).toBeTruthy();
      });
    });
  });

  describe("Export Functionality", () => {
    it("should show export button in success state", async () => {
      const result = renderInTestProvider(<App />);

      // Navigate to main and complete checks
      fireEvent.click(result.getByText("Get Started"));
      await waitFor(() =>
        expect(result.getByText("Select Print Job")).toBeTruthy(),
      );
      fireEvent.click(result.getByText(/Business Card/));
      await waitFor(() =>
        expect(result.getByText("Getting Print Ready")).toBeTruthy(),
      );

      fireEvent.click(result.getByLabelText(/Bleed Area/i));
      fireEvent.click(result.getByLabelText(/Safe Zone/i));

      await waitFor(() => {
        expect(result.getByText("Download Print-Ready PDF")).toBeTruthy();
      });
    });

    it("should not show export button before completing checks", async () => {
      const result = renderInTestProvider(<App />);

      fireEvent.click(result.getByText("Get Started"));
      await waitFor(() =>
        expect(result.getByText("Select Print Job")).toBeTruthy(),
      );
      fireEvent.click(result.getByText(/Business Card/));
      await waitFor(() =>
        expect(result.getByText("Getting Print Ready")).toBeTruthy(),
      );

      // Only complete one check
      fireEvent.click(result.getByLabelText(/Bleed Area/i));

      expect(result.queryByText("Download Print-Ready PDF")).toBeNull();
    });

    it("should request export with bleed options when bleed is required", async () => {
      const result = renderInTestProvider(<App />);

      // Navigate to main and complete checks for Business Card (bleed 0.125)
      fireEvent.click(result.getByText("Get Started"));
      await waitFor(() =>
        expect(result.getByText("Select Print Job")).toBeTruthy(),
      );
      fireEvent.click(result.getByText(/Business Card/));
      await waitFor(() =>
        expect(result.getByText("Getting Print Ready")).toBeTruthy(),
      );

      fireEvent.click(result.getByLabelText(/Bleed Area/i));
      fireEvent.click(result.getByLabelText(/Safe Zone/i));

      await waitFor(() => {
        expect(result.getByText("Download Print-Ready PDF")).toBeTruthy();
        expect(result.getByText(/Bleed included: Yes/)).toBeTruthy();
      });

      fireEvent.click(result.getByText("Download Print-Ready PDF"));

      await waitFor(() => {
        expect(mockRequestExport).toHaveBeenCalledWith(
          expect.objectContaining({
            acceptedFileTypes: ["pdf_standard"],
            bleed: true,
            cropMarks: true,
          }),
        );
      });
    });

    it("should request export without bleed when not required", async () => {
      // Mock page context for Letterhead (8.5x11)
      mockGetCurrentPageContext.mockResolvedValue({
        dimensions: {
          width: 8.5 * 72,
          height: 11 * 72,
        },
      } as Awaited<ReturnType<typeof getCurrentPageContext>>);

      const result = renderInTestProvider(<App />);

      fireEvent.click(result.getByText("Get Started"));
      await waitFor(() =>
        expect(result.getByText("Select Print Job")).toBeTruthy(),
      );

      // Select Letterhead (bleed 0)
      const letterheadBtn = result.getByText(/Letterhead/);
      fireEvent.click(letterheadBtn);

      await waitFor(() =>
        expect(result.getByText("Getting Print Ready")).toBeTruthy(),
      );

      // Complete checks for simple doc (might vary, assuming standard checks for now or just bleed/safe if they appear)
      // Note: Manual checks might be filtered by job props?
      // Based on manualChecks.ts (not seen but assuming generic), we click what's there.
      // If checks are dynamic:
      const checks = result.getAllByRole("checkbox");
      checks.forEach((check) => fireEvent.click(check));

      await waitFor(() => {
        expect(result.getByText("Download Print-Ready PDF")).toBeTruthy();
        // Should show "Bleed included: No (not required)"
        expect(result.getByText(/Bleed included: No/)).toBeTruthy();
      });

      fireEvent.click(result.getByText("Download Print-Ready PDF"));

      await waitFor(() => {
        expect(mockRequestExport).toHaveBeenCalledWith(
          expect.objectContaining({
            acceptedFileTypes: ["pdf_standard"],
            bleed: false,
            cropMarks: false,
          }),
        );
      });
    });

    it("should show confirmation checklist in success state", async () => {
      const result = renderInTestProvider(<App />);

      fireEvent.click(result.getByText("Get Started"));
      await waitFor(() =>
        expect(result.getByText("Select Print Job")).toBeTruthy(),
      );
      fireEvent.click(result.getByText(/Business Card/));
      await waitFor(() =>
        expect(result.getByText("Getting Print Ready")).toBeTruthy(),
      );

      fireEvent.click(result.getByLabelText(/Bleed Area/i));
      fireEvent.click(result.getByLabelText(/Safe Zone/i));

      await waitFor(() => {
        expect(result.getByText(/All checks passed/)).toBeTruthy();
        expect(result.getByText(/Size verified/)).toBeTruthy();
        expect(result.getByText(/Print setup complete/)).toBeTruthy();
      });
    });
  });

  describe("Progressive Disclosure", () => {
    it("should hide optional checks by default", async () => {
      const result = renderInTestProvider(<App />);

      fireEvent.click(result.getByText("Get Started"));
      await waitFor(() =>
        expect(result.getByText("Select Print Job")).toBeTruthy(),
      );
      fireEvent.click(result.getByText(/Business Card/));
      await waitFor(() =>
        expect(result.getByText("Getting Print Ready")).toBeTruthy(),
      );

      // Optional checks should be collapsed
      expect(result.getByText(/Recommended checks/)).toBeTruthy();
      expect(result.queryByLabelText(/Color Check/i)).toBeNull();
    });

    it("should show optional checks when expanded", async () => {
      const result = renderInTestProvider(<App />);

      fireEvent.click(result.getByText("Get Started"));
      await waitFor(() =>
        expect(result.getByText("Select Print Job")).toBeTruthy(),
      );
      fireEvent.click(result.getByText(/Business Card/));
      await waitFor(() =>
        expect(result.getByText("Getting Print Ready")).toBeTruthy(),
      );

      // Expand optional checks
      fireEvent.click(result.getByText(/Recommended checks/));

      await waitFor(() => {
        expect(result.getByLabelText(/Color Check/i)).toBeTruthy();
      });
    });
  });

  describe("Snapshot", () => {
    it("should have a consistent welcome view snapshot", () => {
      const result = renderInTestProvider(<App />);
      expect(result.container).toMatchSnapshot();
    });
  });
});
