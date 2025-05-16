import { Octokit } from "octokit";
import { GetResponseDataTypeFromEndpointMethod } from "@octokit/types";

const github = new Octokit();

export const SearchResultType = {
  USER: "user",
  REPOSITORY: "repository",
} as const;

export type SearchResultType = typeof SearchResultType[keyof typeof SearchResultType];

interface SearchResultBase {
  id: string
  name: string
  type: SearchResultType
  url: string
}

export interface UserResult extends SearchResultBase {
  type:typeof SearchResultType.USER
  avatar?: string
}

export interface RepositoryResult extends SearchResultBase {
  type: typeof SearchResultType.REPOSITORY
  owner?: string
  ownerAvatar?: string
  description?: string | null
  stars?: number
  forks?: number
  language?: string | null
}

export type SearchResult = UserResult | RepositoryResult

const mapGitHubUserToResult = (user: GetResponseDataTypeFromEndpointMethod<typeof github.rest.search.users>["items"][number]): UserResult => ({
  id: user.id.toString(),
  name: user.login,
  type: "user",
  url: user.html_url,
  avatar: user.avatar_url,
})

const mapGitHubRepoToResult = (repo: GetResponseDataTypeFromEndpointMethod<typeof github.rest.search.repos>["items"][number]): RepositoryResult => ({
  id: repo.id.toString(),
  name: repo.name,
  type: "repository",
  url: repo.html_url,
  owner: repo.owner?.login,
  ownerAvatar: repo.owner?.avatar_url,
  description: repo.description,
  stars: repo.stargazers_count,
  forks: repo.forks_count,
  language: repo.language,
})

export async function searchUsers(query: string) {
  if (!query || query.length < 3) return []

  try {
    const response = await github.rest.search.users({
      q: query,
      per_page: 50,
      sort: "followers",
      order: "desc",
    })

    return response.data.items.map(mapGitHubUserToResult)
  } catch (error) {
    console.error("Error searching GitHub users:", error)
    throw error
  }
}

export async function searchRepositories(query: string) {
  if (!query || query.length < 3) return []

  try {
    const response = await github.rest.search.repos({
      q: query,
      per_page: 50,
      sort: "stars",
      order: "desc",
    })

    return response.data.items.map(mapGitHubRepoToResult)
  } catch (error) {
    console.error("Error searching GitHub repositories:", error)
    throw error
  }
}