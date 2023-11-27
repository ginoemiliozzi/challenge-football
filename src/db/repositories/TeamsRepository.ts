import { InsertEntity } from './common'
import { NewTeam, Team, teams } from '../schema'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { ilike, inArray } from 'drizzle-orm'

export interface TeamsRepository extends InsertEntity<NewTeam> {
  // Search a team by shortName
  getByName: (teamName: string) => Promise<Team | undefined>

  // Returns only non existing sourceIds
  filterOutExistingBySourceId: (sourceIds: number[]) => Promise<number[]>

  // Get ids for source ids
  getIdsForSourceIds: (sourceIds: number[]) => Promise<number[]>
}

export default class LiveTeamsRepository implements TeamsRepository {
  constructor(private dbClient: NodePgDatabase<Record<string, never>>) {}

  async getByName(teamName: string): Promise<Team | undefined> {
    const found = await this.dbClient
      .select()
      .from(teams)
      .where(ilike(teams.shortName, `${teamName}`))
    return found[0]
  }

  async filterOutExistingBySourceId(sourceIds: number[]): Promise<number[]> {
    const existingSourceIds = (
      await this.dbClient
        .select({ sourceId: teams.sourceId })
        .from(teams)
        .where(inArray(teams.sourceId, sourceIds))
    ).map((r) => r.sourceId)

    const nonExistingSourceIds = sourceIds.filter(
      (sid) => !existingSourceIds.includes(sid)
    )
    return nonExistingSourceIds
  }

  async getIdsForSourceIds(sourceIds: number[]): Promise<number[]> {
    const results = (
      await this.dbClient
        .select({ id: teams.id })
        .from(teams)
        .where(inArray(teams.sourceId, sourceIds))
    ).map((r) => r.id)

    return results
  }

  async insertMany(newTeams: NewTeam[]): Promise<Team['id'][]> {
    const results = await this.dbClient
      .insert(teams)
      .values(newTeams)
      .returning({ id: teams.id })
    return results.map((r) => r.id)
  }

  async insert(newTeam: NewTeam): Promise<Team['id']> {
    const results = await this.insertMany([newTeam])
    return results[0]
  }
}
