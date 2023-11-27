import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { TeamsCompetition, competitions, teams_competitions } from '../schema'
import { InsertEntity } from './common'
import { eq } from 'drizzle-orm'

export interface TeamsCompetitionsRepository
  extends InsertEntity<TeamsCompetition> {
  getTeamsInLeague: (leagueCode: string) => Promise<TeamsCompetition[]>
}

export default class LiveTeamsCompetitionsRepository
  implements TeamsCompetitionsRepository
{
  constructor(private dbClient: NodePgDatabase<Record<string, never>>) {}

  async insertMany(
    newTeamsComp: TeamsCompetition[]
  ): Promise<TeamsCompetition['teamId'][]> {
    const results = await this.dbClient
      .insert(teams_competitions)
      .values(newTeamsComp)
      .returning({ id: teams_competitions.teamId })
    return results.map((r) => r.id)
  }

  async insert(
    newTeamComp: TeamsCompetition
  ): Promise<TeamsCompetition['teamId']> {
    const results = await this.insertMany([newTeamComp])
    return results[0]
  }

  async getTeamsInLeague(leagueCode: string): Promise<TeamsCompetition[]> {
    const results = await this.dbClient
      .select({
        competitionId: competitions.id,
        teamId: teams_competitions.teamId,
      })
      .from(teams_competitions)
      .innerJoin(
        competitions,
        eq(teams_competitions.competitionId, competitions.id)
      )
      .where(eq(competitions.code, leagueCode))

    return results
  }
}
