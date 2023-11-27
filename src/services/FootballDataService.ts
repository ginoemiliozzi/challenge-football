import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

export interface FootballDataService {
  getLeague: (leagueCode: string) => Promise<CompetitionResponse>
  getLeagueTeams: (leagueId: number) => Promise<CompetitionTeamsResponse>
}

export default class LiveFootballDataService implements FootballDataService {
  private BASE_API_URL: string = 'http://api.football-data.org/v4'

  async getLeague(leagueCode: string): Promise<CompetitionResponse> {
    return this.getRequest<CompetitionResponse>(
      `${this.BASE_API_URL}/competitions/${leagueCode}`
    )
  }

  async getLeagueTeams(leagueId: number): Promise<CompetitionTeamsResponse> {
    return this.getRequest<CompetitionTeamsResponse>(
      `${this.BASE_API_URL}/competitions/${leagueId}/teams`
    )
  }

  private async getRequest<E>(url: string): Promise<E> {
    const response = await axios.get(url, {
      headers: {
        'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY,
      },
    })

    const asEntity: E = response.data
    return asEntity
  }
}

interface CompetitionResponse {
  id: number
  name: string
  code: string
  area: {
    name: string
  }
}

interface PlayerResponse {
  id: number
  name: string
  position: string
  dateOfBirth: string
  nationality: string
}

interface CoachResponse extends Partial<PlayerResponse> {}

export interface TeamResponse extends TeamMembersResponse {
  id: number
  shortName: string
  tla: string
  address: string
  area: {
    name: string
  }
}

interface CompetitionTeamsResponse {
  teams: TeamResponse[]
}

export interface TeamMembersResponse {
  coach: CoachResponse
  squad: PlayerResponse[]
}
