"use client";

import {
  useState,
  useEffect,
  useRef,
  type KeyboardEvent,
  useCallback,
} from "react";
import {
  Search,
  Loader2,
  User,
  BookOpen,
  AlertCircle,
  Star,
  GitFork,
  Code,
} from "lucide-react";
import { useQueries } from "@tanstack/react-query";
import { useDebounceValue } from "usehooks-ts";
import {
  RepositoryResult,
  searchRepositories,
  SearchResult,
  SearchResultType,
  searchUsers,
} from "@/lib/github";

const useAutocomplete = (query: string) => {
  const queries = useQueries({
    queries: [
      {
        queryKey: ["users", query],
        queryFn: () => searchUsers(query),
        enabled: query.length >= 3,
        refetchOnWindowFocus: false,
      },
      {
        queryKey: ["repos", query],
        queryFn: () => searchRepositories(query),
        enabled: query.length >= 3,
        refetchOnWindowFocus: false,
      },
    ],
  });

  const [usersQuery, reposQuery] = queries;
  const users = usersQuery.data || [];
  const repositories = reposQuery.data || [];
  const results = [...users, ...repositories]
    .sort((a, b) => a.name?.localeCompare(b.name ?? "") ?? 0)
    .slice(0, 50);

  return {
    results,
    loading: usersQuery.isLoading || reposQuery.isLoading,
    fetching: usersQuery.isFetching || reposQuery.isFetching,
    error: usersQuery.error || reposQuery.error,
  };
};

const RepositoryDetails = ({ result }: { result: RepositoryResult }) => (
  <div className="mt-1 pl-7">
    {result.description && (
      <p className="text-xs text-gray-500 line-clamp-1">{result.description}</p>
    )}
    <div className="flex items-center mt-1 space-x-3 text-xs text-gray-500">
      {result.owner && (
        <span className="flex items-center">
          <User className="size-3 mr-1" />
          {result.owner}
        </span>
      )}
      {result.stars !== undefined && (
        <span className="flex items-center">
          <Star className="size-3 mr-1" />
          {result.stars.toLocaleString()}
        </span>
      )}
      {result.forks !== undefined && (
        <span className="flex items-center">
          <GitFork className="size-3 mr-1" />
          {result.forks.toLocaleString()}
        </span>
      )}
      {result.language && (
        <span className="flex items-center">
          <Code className="size-3 mr-1" />
          {result.language}
        </span>
      )}
    </div>
  </div>
);

const ResultIcon = ({ result }: { result: SearchResult }) => {
  if (result.type === "user" && "avatar" in result && result.avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={result.avatar}
        alt={`${result.name}'s avatar`}
        className="size-5 shrink-0 rounded-full mr-2"
      />
    );
  }

  if (result.type === "user") {
    return <User className="size-5 shrink-0 mr-2 text-gray-500" />;
  }

  return <BookOpen className="size-5 shrink-0 mr-2 text-gray-500" />;
};

const SearchResultItem = ({
  result,
  selected,
  onSelect,
  onMouseEnter,
}: {
  result: SearchResult;
  selected: boolean;
  onSelect: () => void;
  onMouseEnter: () => void;
}) => (
  <li
    className={`flex flex-col px-4 py-2 text-sm cursor-pointer ${
      selected && "bg-gray-100"
    }`}
    onClick={onSelect}
    onMouseEnter={onMouseEnter}
    role="option"
    aria-selected={selected}
  >
    <div className="flex items-center">
      <ResultIcon result={result} />
      <span className="font-medium truncate">{result.name}</span>
      <span className="ml-2 text-xs text-gray-400">{result.type}</span>
    </div>

    {result.type === SearchResultType.REPOSITORY && (
      <RepositoryDetails result={result} />
    )}
  </li>
);

const ErrorMessage = ({ error }: { error: unknown }) => (
  <div className="flex items-center p-4 text-red-500">
    <AlertCircle className="w-5 h-5 mr-2" />
    <span className="text-sm leading-tight">
      {error instanceof Error
        ? error.message
        : "Failed to fetch results. GitHub API rate limit may have been exceeded."}
    </span>
  </div>
);

const SearchResults = ({
  results,
  selectedIndex,
  onSelectResult,
  onMouseEnter,
  fetching,
  error,
  debouncedQuery,
  ref,
}: {
  results: SearchResult[];
  selectedIndex: number;
  onSelectResult: (result: SearchResult) => void;
  onMouseEnter: (index: number) => void;
  fetching: boolean;
  error: unknown;
  debouncedQuery: string;
  ref: React.RefObject<HTMLUListElement | null>;
}) => {
  if (fetching && !results.length) {
    return null;
  }

  return (
    <div className="absolute z-10 w-full mt-2 rounded-md shadow-md max-h-80 overflow-y-auto border border-gray-300">
      {!!error && <ErrorMessage error={error} />}

      {!error && debouncedQuery.length > 3 && !results.length && (
        <div className="p-4 text-sm text-gray-400 text-center">
          No results found for &quot;{debouncedQuery}&quot;
        </div>
      )}

      {results.length > 0 && (
        <ul
          ref={ref}
          className={`py-1 ${fetching ? "opacity-50 pointer-events-none" : ""}`}
          id="search-results"
          role="listbox"
        >
          {results.map((result, index) => (
            <SearchResultItem
              key={result.id}
              result={result}
              selected={index === selectedIndex}
              onSelect={() => onSelectResult(result)}
              onMouseEnter={() => onMouseEnter(index)}
            />
          ))}
        </ul>
      )}

      {debouncedQuery.length < 3 && (
        <div className="p-4 text-sm text-gray-400 text-center">
          Type at least 3 characters to search
        </div>
      )}
    </div>
  );
};

const SearchInput = ({
  query,
  onQueryChange,
  onKeyDown,
  onFocus,
  fetching,
  ref,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  fetching: boolean;
  ref: React.RefObject<HTMLInputElement | null>;
}) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 text-gray-400 flex items-center pl-4 pointer-events-none">
      {fetching ? (
        <Loader2
          className="size-5 animate-spin"
          data-testid="loading-indicator"
        />
      ) : (
        <Search className="size-5" data-testid="search-icon" />
      )}
    </div>
    <input
      ref={ref}
      type="text"
      className="w-full py-3 pl-12 pr-4 text-sm border border-gray-300 font-sans rounded-md focus:outline-none focus:ring-offset-1 focus:ring-2 focus:ring-gray-400"
      placeholder="Search GitHub users and repositories..."
      value={query}
      onChange={e => onQueryChange(e.target.value)}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      aria-label="Search GitHub users and repositories"
      aria-autocomplete="list"
      aria-controls="search-results"
      role="searchbox"
    />
  </div>
);

export function Autocomplete() {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounceValue(query, 300);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [focused, setFocused] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const resultListRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { results, fetching, error } = useAutocomplete(debouncedQuery);

  useEffect(() => {
    if (!fetching) {
      setSelectedIndex(-1);
    }
  }, [fetching]);

  const navigateDown = useCallback(() => {
    setSelectedIndex(prev => {
      const newIndex = prev < results.length - 1 ? prev + 1 : prev;
      return newIndex;
    });
  }, [results.length]);

  const navigateUp = useCallback(() => {
    setSelectedIndex(prev => {
      const newIndex = prev > 0 ? prev - 1 : 0;
      return newIndex;
    });
  }, []);

  const handleSelectResult = useCallback((result: SearchResult) => {
    window.open(result.url, "_blank");
    inputRef.current?.blur();
  }, []);

  const handleMouseEnter = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (!results.length || fetching) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          navigateDown();
          break;
        case "ArrowUp":
          e.preventDefault();
          navigateUp();
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            handleSelectResult(results[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setFocused(false);
          inputRef.current?.blur();
          break;
      }
    },
    [
      results,
      selectedIndex,
      fetching,
      navigateDown,
      navigateUp,
      handleSelectResult,
    ]
  );

  useEffect(() => {
    if (selectedIndex >= 0 && resultListRef.current) {
      const selectedElement = resultListRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full max-w-md" ref={containerRef}>
      <SearchInput
        query={query}
        onQueryChange={handleQueryChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        fetching={fetching}
        ref={inputRef}
      />

      {focused && (
        <SearchResults
          results={results}
          selectedIndex={selectedIndex}
          onSelectResult={handleSelectResult}
          onMouseEnter={handleMouseEnter}
          fetching={fetching}
          error={error}
          debouncedQuery={debouncedQuery}
          ref={resultListRef}
        />
      )}
    </div>
  );
}
