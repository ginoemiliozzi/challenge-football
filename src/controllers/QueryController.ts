import { Request, Response } from 'express'
import { TeamsRepository } from '../db/repositories/TeamsRepository'
import { CompetitionsRepository } from '../db/repositories/CompetitionsRepository'
import { MembersRepository } from '../db/repositories/MembersRepository'
import { TeamsCompetitionsRepository } from '../db/repositories/TeamsCompetitionsRepository'

export class QueryController {
  private teamsRepository: TeamsRepository
  private competitionsRepository: CompetitionsRepository
  private membersRepository: MembersRepository
  private teamsCompetitionsRepository: TeamsCompetitionsRepository

  constructor(
    teamsRepository: TeamsRepository,
    competitionsRepository: CompetitionsRepository,
    membersRepository: MembersRepository,
    teamsCompetitionsRepository: TeamsCompetitionsRepository
  ) {
    this.teamsRepository = teamsRepository
    this.competitionsRepository = competitionsRepository
    this.membersRepository = membersRepository
    this.teamsCompetitionsRepository = teamsCompetitionsRepository
  }

  /**
   * Takes leagueCode as a parameter and returns the players/coaches that participate in that competition.
   *  If the given leagueCode is not present in the DB, responds with an error message.
   *  If there are no teams in the competition, responds with an error message
   *  Additionaly a query parameter name can be used to filter players by name
   */
  public players = async (req: Request, res: Response) => {
    try {
      const leagueCode = req.params?.leagueCode
      const leagueExists = await this.competitionsRepository.exists(leagueCode)
      if (!leagueExists)
        return res.status(404).send({
          error: 'The competition does not exist in the database',
        })

      const teamsCompetitionsResults =
        await this.teamsCompetitionsRepository.getTeamsInLeague(leagueCode)
      if (!teamsCompetitionsResults.length)
        return res
          .status(404)
          .send({ error: 'There are no teams for the given league' })

      const nameQueryParam = req.query?.name
      const nameFilter =
        typeof nameQueryParam === 'string' ? nameQueryParam : undefined
      const teamIdsInLeague = teamsCompetitionsResults.map((tc) => tc.teamId)
      const playersResults = await this.membersRepository.getMembersForTeams(
        teamIdsInLeague,
        nameFilter
      )

      res.status(200).send(playersResults)
    } catch (error: any) {
      res.status(500).send({
        error: error.message,
      })
    }
  }

  /**
   * Takes a name and returns the corresponding team.
   * If requested in the query (members param != false), it resolves the players/coach for that team
   */
  public teams = async (req: Request, res: Response) => {
    try {
      const withMembers = Boolean(
        req.query?.members && !req.query?.members?.toString().includes('false')
      )

      const teamName = req.params?.name
      const matchingTeam = await this.teamsRepository.getByName(teamName)
      if (!matchingTeam)
        return res.status(404).send({ error: 'The team does not exist' })

      if (!withMembers) return res.status(200).send(matchingTeam)

      const teamMembers = (
        await this.membersRepository.getMembersForTeams([matchingTeam.id])
      )[0]

      const responseWithMembers = {
        ...matchingTeam,
        members: teamMembers.members,
      }

      return res.status(200).send(responseWithMembers)
    } catch (error: any) {
      res.status(500).send({
        error: error.message,
      })
    }
  }
}
