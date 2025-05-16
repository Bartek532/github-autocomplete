import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { Autocomplete } from "./autocomplete";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

Element.prototype.scrollIntoView = jest.fn();

jest.mock("@/lib/github", () => {
  return {
    searchUsers: jest.fn(),
    searchRepositories: jest.fn(),
    SearchResultType: {
      USER: "user",
      REPOSITORY: "repository",
    },
  };
});

import {
  searchUsers,
  searchRepositories,
  SearchResultType,
} from "@/lib/github";

const mockOpen = jest.fn();
Object.defineProperty(window, "open", {
  writable: true,
  value: mockOpen,
});

const QueryWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("Autocomplete component", () => {
  const mockUsers = [
    {
      id: "user1",
      name: "johnsmith",
      type: SearchResultType.USER,
      url: "https://github.com/johnsmith",
      avatar: "https://avatars.githubusercontent.com/u/1234",
    },
    {
      id: "user2",
      name: "janesmith",
      type: SearchResultType.USER,
      url: "https://github.com/janesmith",
      avatar: "https://avatars.githubusercontent.com/u/5678",
    },
  ];

  const mockRepos = [
    {
      id: "repo1",
      name: "awesome-project",
      type: SearchResultType.REPOSITORY,
      url: "https://github.com/johnsmith/awesome-project",
      owner: "johnsmith",
      description: "An awesome project",
      stars: 100,
      forks: 20,
      language: "TypeScript",
    },
    {
      id: "repo2",
      name: "cool-lib",
      type: SearchResultType.REPOSITORY,
      url: "https://github.com/janesmith/cool-lib",
      owner: "janesmith",
      description: "A cool library",
      stars: 500,
      forks: 50,
      language: "JavaScript",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (searchUsers as jest.Mock).mockResolvedValue([]);
    (searchRepositories as jest.Mock).mockResolvedValue([]);
  });

  test("renders search input correctly", () => {
    // ARRANGE
    render(<Autocomplete />, { wrapper: QueryWrapper });

    // ASSERT
    const searchInput = screen.getByRole("searchbox");
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute(
      "placeholder",
      "Search GitHub users and repositories..."
    );
  });

  test("shows minimum character message when fewer than 3 characters are entered", async () => {
    // ARRANGE
    render(<Autocomplete />, { wrapper: QueryWrapper });

    // ACT
    const searchInput = screen.getByRole("searchbox");
    await userEvent.click(searchInput);
    await userEvent.type(searchInput, "ab");

    // ASSERT
    expect(
      screen.getByText("Type at least 3 characters to search")
    ).toBeInTheDocument();
  });

  test("does not call API when fewer than 3 characters are entered", async () => {
    // ARRANGE
    render(<Autocomplete />, { wrapper: QueryWrapper });

    // ACT
    const searchInput = screen.getByRole("searchbox");
    await userEvent.click(searchInput);
    await userEvent.type(searchInput, "ab");

    // ASSERT
    expect(searchUsers).not.toHaveBeenCalled();
    expect(searchRepositories).not.toHaveBeenCalled();
  });

  test("calls API when 3 or more characters are entered", async () => {
    // ARRANGE
    render(<Autocomplete />, { wrapper: QueryWrapper });

    // ACT
    const searchInput = screen.getByRole("searchbox");
    await userEvent.click(searchInput);
    await userEvent.type(searchInput, "abc");

    // ASSERT
    await waitFor(() => {
      expect(searchUsers).toHaveBeenCalledWith("abc");
      expect(searchRepositories).toHaveBeenCalledWith("abc");
    });
  });

  test("displays search results when API returns data", async () => {
    // ARRANGE
    (searchUsers as jest.Mock).mockResolvedValue(mockUsers);
    (searchRepositories as jest.Mock).mockResolvedValue(mockRepos);
    render(<Autocomplete />, { wrapper: QueryWrapper });

    // ACT
    const searchInput = screen.getByRole("searchbox");
    await userEvent.click(searchInput);
    await userEvent.type(searchInput, "smith");

    // ASSERT
    await waitFor(() => {
      expect(screen.getAllByText("johnsmith")[0]).toBeInTheDocument();
      expect(screen.getAllByText("janesmith")[0]).toBeInTheDocument();
      expect(screen.getByText("awesome-project")).toBeInTheDocument();
      expect(screen.getByText("cool-lib")).toBeInTheDocument();
    });
  });

  test("displays repository details for repository results", async () => {
    // ARRANGE
    (searchUsers as jest.Mock).mockResolvedValue([]);
    (searchRepositories as jest.Mock).mockResolvedValue(mockRepos);
    render(<Autocomplete />, { wrapper: QueryWrapper });

    // ACT
    const searchInput = screen.getByRole("searchbox");
    await userEvent.click(searchInput);
    await userEvent.type(searchInput, "project");

    // ASSERT
    await waitFor(() => {
      expect(screen.getByText("An awesome project")).toBeInTheDocument();
      expect(screen.getByText("TypeScript")).toBeInTheDocument();
      expect(screen.getByText("100")).toBeInTheDocument();
      expect(screen.getByText("20")).toBeInTheDocument();
    });
  });

  test('shows "No results found" message when no results are returned', async () => {
    // ARRANGE
    (searchUsers as jest.Mock).mockResolvedValue([]);
    (searchRepositories as jest.Mock).mockResolvedValue([]);
    render(<Autocomplete />, { wrapper: QueryWrapper });

    // ACT
    const searchInput = screen.getByRole("searchbox");
    await userEvent.click(searchInput);
    await userEvent.type(searchInput, "nonexistent");

    // ASSERT
    await waitFor(() => {
      expect(
        screen.getByText('No results found for "nonexistent"')
      ).toBeInTheDocument();
    });
  });

  test("navigates through results with keyboard arrow keys", async () => {
    // ARRANGE
    (searchUsers as jest.Mock).mockResolvedValue(mockUsers);
    (searchRepositories as jest.Mock).mockResolvedValue([]);
    render(<Autocomplete />, { wrapper: QueryWrapper });

    // ACT
    const searchInput = screen.getByRole("searchbox");
    await userEvent.click(searchInput);
    await userEvent.type(searchInput, "smith");

    await waitFor(() => {
      expect(screen.getAllByText("janesmith")[0]).toBeInTheDocument();
    });

    await userEvent.keyboard("{ArrowDown}");

    // ASSERT
    expect(screen.getByRole("option", { name: /janesmith/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );

    // ACT - Navigate down again
    await userEvent.keyboard("{ArrowDown}");

    // ASSERT
    expect(screen.getByRole("option", { name: /johnsmith/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );

    // ACT - Navigate up
    await userEvent.keyboard("{ArrowUp}");

    // ASSERT
    expect(screen.getByRole("option", { name: /janesmith/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  test("selects result on Enter key", async () => {
    // ARRANGE
    (searchUsers as jest.Mock).mockResolvedValue(mockUsers);
    (searchRepositories as jest.Mock).mockResolvedValue([]);
    render(<Autocomplete />, { wrapper: QueryWrapper });

    // ACT
    const searchInput = screen.getByRole("searchbox");
    await userEvent.click(searchInput);
    await userEvent.type(searchInput, "smith");

    await waitFor(() => {
      expect(screen.getByText("janesmith")).toBeInTheDocument();
    });

    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{Enter}");

    // ASSERT
    expect(mockOpen).toHaveBeenCalledWith(
      "https://github.com/janesmith",
      "_blank"
    );
  });

  test("selects result on click", async () => {
    // ARRANGE
    (searchUsers as jest.Mock).mockResolvedValue(mockUsers);
    (searchRepositories as jest.Mock).mockResolvedValue([]);
    render(<Autocomplete />, { wrapper: QueryWrapper });

    // ACT
    const searchInput = screen.getByRole("searchbox");
    await userEvent.click(searchInput);
    await userEvent.type(searchInput, "smith");

    await waitFor(() => {
      expect(screen.getByText("johnsmith")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("option", { name: /johnsmith/i }));

    // ASSERT
    expect(mockOpen).toHaveBeenCalledWith(
      "https://github.com/johnsmith",
      "_blank"
    );
  });

  test("closes dropdown on Escape key", async () => {
    // ARRANGE
    (searchUsers as jest.Mock).mockResolvedValue(mockUsers);
    (searchRepositories as jest.Mock).mockResolvedValue([]);
    render(<Autocomplete />, { wrapper: QueryWrapper });

    // ACT
    const searchInput = screen.getByRole("searchbox");
    await userEvent.click(searchInput);
    await userEvent.type(searchInput, "smith");

    await waitFor(() => {
      expect(screen.getByText("johnsmith")).toBeInTheDocument();
    });

    await userEvent.keyboard("{Escape}");

    // ASSERT
    expect(screen.queryByText("johnsmith")).not.toBeInTheDocument();
  });

  test("displays error message when API call fails", async () => {
    // ARRANGE
    const error = new Error("API rate limit exceeded");
    (searchUsers as jest.Mock).mockRejectedValue(error);
    (searchRepositories as jest.Mock).mockRejectedValue(error);
    render(<Autocomplete />, { wrapper: QueryWrapper });

    // ACT
    const searchInput = screen.getByRole("searchbox");
    await userEvent.click(searchInput);
    await userEvent.type(searchInput, "smith");

    // ASSERT
    await waitFor(() => {
      expect(screen.getByText("API rate limit exceeded")).toBeInTheDocument();
    });
  });

  test("displays loading indicator while fetching results", async () => {
    // ARRANGE
    let resolveUsers: (value: unknown) => void;
    const usersPromise = new Promise(resolve => {
      resolveUsers = resolve;
    });

    (searchUsers as jest.Mock).mockImplementation(() => usersPromise);
    (searchRepositories as jest.Mock).mockResolvedValue([]);
    render(<Autocomplete />, { wrapper: QueryWrapper });

    // ACT
    const searchInput = screen.getByRole("searchbox");
    await userEvent.click(searchInput);
    await userEvent.type(searchInput, "loading");

    // ASSERT
    const loadingIndicator = await waitFor(() =>
      screen.getByTestId("loading-indicator")
    );
    expect(loadingIndicator).toBeInTheDocument();

    // Cleanup
    act(() => {
      resolveUsers([]);
    });
  });

  test("closes dropdown when clicking outside", async () => {
    // ARRANGE
    (searchUsers as jest.Mock).mockResolvedValue(mockUsers);
    (searchRepositories as jest.Mock).mockResolvedValue([]);
    render(<Autocomplete />, { wrapper: QueryWrapper });

    // ACT
    const searchInput = screen.getByRole("searchbox");
    await userEvent.click(searchInput);
    await userEvent.type(searchInput, "smith");

    await waitFor(() => {
      expect(screen.getByText("johnsmith")).toBeInTheDocument();
    });

    fireEvent.mouseDown(document.body);

    // ASSERT
    expect(screen.queryByText("johnsmith")).not.toBeInTheDocument();
  });

  test("does not navigate beyond the bounds of results", async () => {
    // ARRANGE
    (searchUsers as jest.Mock).mockResolvedValue(mockUsers);
    (searchRepositories as jest.Mock).mockResolvedValue([]);
    render(<Autocomplete />, { wrapper: QueryWrapper });

    // ACT
    const searchInput = screen.getByRole("searchbox");
    await userEvent.click(searchInput);
    await userEvent.type(searchInput, "smith");

    await waitFor(() => {
      expect(screen.getByText("janesmith")).toBeInTheDocument();
    });

    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{ArrowDown}");

    // ASSERT
    expect(screen.getByRole("option", { name: /johnsmith/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });

  test("handles mouse hover on results correctly", async () => {
    // ARRANGE
    (searchUsers as jest.Mock).mockResolvedValue(mockUsers);
    (searchRepositories as jest.Mock).mockResolvedValue([]);
    render(<Autocomplete />, { wrapper: QueryWrapper });

    // ACT
    const searchInput = screen.getByRole("searchbox");
    await userEvent.click(searchInput);
    await userEvent.type(searchInput, "smith");

    await waitFor(() => {
      expect(screen.getByText("johnsmith")).toBeInTheDocument();
    });

    fireEvent.mouseEnter(screen.getByRole("option", { name: /janesmith/i }));

    // ASSERT
    expect(screen.getByRole("option", { name: /janesmith/i })).toHaveAttribute(
      "aria-selected",
      "true"
    );
  });
});
