import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Member, NewMember, Team, members, teams } from '../schema'
import { InsertEntity } from './common'
import { SQL, and, eq, ilike, inArray, sql } from 'drizzle-orm'

export interface TeamMembers {
  teamId: number
  teamName: string
  members: Member[]
}

export interface MembersRepository extends InsertEntity<NewMember> {
  // Get all the members for each team
  getMembersForTeams: (
    teams: Team['id'][],
    nameFilter?: string
  ) => Promise<TeamMembers[]>
}

export default class LiveMembersRepository implements MembersRepository {
  constructor(private dbClient: NodePgDatabase<Record<string, never>>) {}

  async getMembersForTeams(
    teamIds: Team['id'][],
    nameFilter: string | undefined = undefined
  ): Promise<TeamMembers[]> {
    const baseWhereClause: SQL[] = [inArray(members.currentTeam, teamIds)]

    const totalWhereClause = nameFilter
      ? baseWhereClause.concat(ilike(members.name, `%${nameFilter}%`))
      : baseWhereClause

    const results = await this.dbClient
      .select({
        teamId: members.currentTeam,
        teamName: teams.shortName,
        members: sql<Member[]>`JSONB_AGG(
                jsonb_build_object(
                  'id', ${members.id},
                  'name', ${members.name},
                  'position', ${members.position},
                  'dateOfBirth', ${members.dateOfBirth},
                  'nationality', ${members.nationality}
                )
              )`,
      })
      .from(members)
      .innerJoin(teams, eq(members.currentTeam, teams.id))
      .where(and(...totalWhereClause))
      .groupBy(members.currentTeam, teams.shortName)

    return results
  }

  async insertMany(newMembers: NewMember[]): Promise<Member['id'][]> {
    const results = await this.dbClient
      .insert(members)
      .values(newMembers)
      .returning({ id: members.id })
    return results.map((r) => r.id)
  }

  async insert(newMember: NewMember): Promise<Member['id']> {
    const results = await this.insertMany([newMember])
    return results[0]
  }
}
