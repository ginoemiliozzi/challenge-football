import { CompetitionsRepository } from '../db/repositories/CompetitionsRepository'
import { MembersRepository } from '../db/repositories/MembersRepository'
import { TeamsCompetitionsRepository } from '../db/repositories/TeamsCompetitionsRepository'
import { TeamsRepository } from '../db/repositories/TeamsRepository'
import { FootballDataService } from './FootballDataService'

export interface ImportLeagueService {
  importLeague: (leagueCode: string) => Promise<void>
}

export default class LiveImportLeagueService implements ImportLeagueService {
  constructor(
    private footballDataService: FootballDataService,
    private teamsRepo: TeamsRepository,
    private membersRepo: MembersRepository,
    private competitionsRepo: CompetitionsRepository,
    private teamsCompetitionsRepo: TeamsCompetitionsRepository
  ) {}

  async importLeague(leagueCode: string) {
    try {
      const competitionRes = await this.footballDataService.getLeague(
        leagueCode
      )

      // Create competition if does not exist
      const createdCompetitionId = await this.competitionsRepo.insert({
        ...competitionRes,
        sourceId: competitionRes.id,
        areaName: competitionRes.area.name,
      })
      if (!createdCompetitionId)
        return Promise.reject(new ExistingLeagueError())

      // Get teams and filter out existing teams
      const competitionTeamsRes = await this.footballDataService.getLeagueTeams(
        competitionRes.id
      )
      const allTeamsInCompetition = new Map(
        competitionTeamsRes.teams.map((t) => [t.id, t])
      )
      const allTeamSourceIds = [...allTeamsInCompetition.keys()]
      const missingTeamsSourceIds =
        await this.teamsRepo.filterOutExistingBySourceId(allTeamSourceIds)
      const newTeams = missingTeamsSourceIds.map(
        (id) => allTeamsInCompetition.get(id)!
      )

      // Create non existing teams
      const createdTeamsIds = await this.teamsRepo.insertMany(
        newTeams.map((t) => ({
          ...t,
          sourceId: t.id,
          areaName: t.area.name,
        }))
      )

      // Add teams competition relation for new and existing teams
      const existingTeamsSourceIds = allTeamSourceIds.filter(
        (sid) => !missingTeamsSourceIds.includes(sid)
      )
      const existingTeamsIds = existingTeamsSourceIds.length
        ? await this.teamsRepo.getIdsForSourceIds(existingTeamsSourceIds)
        : []
      const relationsToCreate = createdTeamsIds
        .concat(existingTeamsIds)
        .map((tid) => ({
          teamId: tid,
          competitionId: createdCompetitionId,
        }))
      await this.teamsCompetitionsRepo.insertMany(relationsToCreate)

      // Create players/coach for each new team
      await Promise.all(
        newTeams.map(async (newTeam) => {
          if (newTeam.squad.length)
            return this.membersRepo.insertMany(
              newTeam.squad.map((p) => ({
                ...p,
                sourceId: p.id,
                currentTeam: newTeam.id,
              }))
            )
          else
            return this.membersRepo.insert({
              sourceId: newTeam.coach.id,
              currentTeam: newTeam.id,
              position: 'coach',
              dateOfBirth: newTeam.coach.dateOfBirth,
              nationality: newTeam.coach.nationality,
              name: newTeam.coach.name,
            })
        })
      )
    } catch (e: any) {
      if (
        e?.response?.data?.errorCode === 400 || // malformed league code response
        e?.response?.data?.error === 404 // not found league code response
      )
        return Promise.reject(new LeagueNotFoundError())
      else return Promise.reject(e)
    }
  }
}

export class ExistingLeagueError {
  public message = 'This competition already exists in the database'
}

export class LeagueNotFoundError {
  public message = 'This competition does not exist in the API'
}
