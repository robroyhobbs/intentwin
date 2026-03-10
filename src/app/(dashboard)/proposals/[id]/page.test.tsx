// @vitest-environment jsdom

import { act, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProposalStatus } from "@/lib/constants/statuses";

import ProposalPage from "./page";

const mockUseParams = vi.fn();
const mockUseRouter = vi.fn();
const mockUseSearchParams = vi.fn();
const mockUseAuthFetch = vi.fn();
const mockToastError = vi.fn();
const mockStartProposalGenerationPoll = vi.fn();
const mockStartBackgroundGeneration = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => mockUseParams(),
  useRouter: () => mockUseRouter(),
  useSearchParams: () => mockUseSearchParams(),
}));

vi.mock("next/dynamic", () => ({
  default: () => {
    const MockDynamicComponent = () => null;
    MockDynamicComponent.displayName = "MockDynamicComponent";
    return MockDynamicComponent;
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: vi.fn(),
  },
}));

vi.mock("@/hooks/use-auth-fetch", () => ({
  useAuthFetch: () => mockUseAuthFetch(),
}));

vi.mock("@/lib/proposals/proposal-generation-runner", () => ({
  startProposalGenerationPoll: (...args: unknown[]) =>
    mockStartProposalGenerationPoll(...args),
}));

vi.mock("@/lib/proposals/background-generation", () => ({
  startBackgroundGeneration: (...args: unknown[]) =>
    mockStartBackgroundGeneration(...args),
}));

vi.mock("@/components/ui/section-nav-sidebar", () => ({
  SectionNavSidebar: () => null,
}));

vi.mock("@/components/ui/skeleton", () => ({
  SkeletonSection: () => <div>Skeleton</div>,
}));

vi.mock("@/components/ui/deal-outcome-setter", () => ({
  DealOutcomeSetter: () => null,
}));

vi.mock("./_components/proposal-top-bar", () => ({
  ProposalTopBar: () => null,
}));

vi.mock("./_components/tab-bar", () => ({
  TabBar: () => null,
}));

vi.mock("./_components/section-content-pane", () => ({
  SectionContentPane: () => null,
}));

describe("ProposalPage generation polling", () => {
  beforeEach(() => {
    mockUseParams.mockReturnValue({ id: "proposal-1" });
    mockUseRouter.mockReturnValue({ push: vi.fn(), replace: vi.fn() });
    mockUseSearchParams.mockReturnValue({
      get: vi.fn().mockReturnValue(null),
    });
    mockStartBackgroundGeneration.mockReset();
    mockStartProposalGenerationPoll.mockReset();
    mockToastError.mockReset();
  });

  it("uses the shared generation runner and preserves timeout refresh behavior", async () => {
    const cancel = vi.fn();
    mockStartProposalGenerationPoll.mockReturnValue({
      cancel,
      isCancelled: () => false,
      promise: Promise.resolve(),
    });

    const fetchMock = vi
      .fn<(url: string, options?: RequestInit) => Promise<Response>>()
      .mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            proposal: {
              id: "proposal-1",
              title: "Test Proposal",
              status: ProposalStatus.GENERATING,
              generation_error: null,
            },
            sections: [],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      });
    mockUseAuthFetch.mockReturnValue(fetchMock);

    const { unmount } = render(<ProposalPage />);

    await waitFor(() => {
      expect(mockStartProposalGenerationPoll).toHaveBeenCalledTimes(1);
    });

    const [options] = mockStartProposalGenerationPoll.mock.calls[0] as [
      {
        proposalId: string;
        onTimeout?: () => Promise<void> | void;
      },
    ];

    expect(options.proposalId).toBe("proposal-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await options.onTimeout?.();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(mockToastError).toHaveBeenCalledWith(
      "Generation is taking longer than expected. Please refresh the page.",
    );

    unmount();

    expect(cancel).toHaveBeenCalledTimes(1);
  });
});
