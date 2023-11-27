import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Competition, NewCompetition, competitions } from '../schema'
import { InsertEntity } from './common'
import { eq } from 'drizzle-orm'

export interface CompetitionsRepository extends InsertEntity<NewCompetition> {
  exists: (leagueCode: string) => Promise<boolean>
}

export default class LiveCompetitionsRepository
  implements CompetitionsRepository
{
  constructor(private dbClient: NodePgDatabase<Record<string, never>>) {}

  async insertMany(newComps: NewCompetition[]): Promise<Competition['id'][]> {
    const results = await this.dbClient
      .insert(competitions)
      .values(newComps)
      .returning({ id: competitions.id })
      .onConflictDoNothing() // If there is a conflict this does not fail and returns undefined

    return results.map((r) => r.id)
  }

  async insert(newComp: NewCompetition): Promise<Competition['id']> {
    const results = await this.insertMany([newComp])
    return results[0]
  }

  async exists(leagueCode: string): Promise<boolean> {
    const exists = await this.dbClient
      .select({ id: competitions.id })
      .from(competitions)
      .where(eq(competitions.code, leagueCode))

    return Boolean(exists.length)
  }
}
