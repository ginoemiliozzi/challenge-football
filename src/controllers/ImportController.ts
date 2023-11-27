import { Request, Response } from 'express'
import {
  ExistingLeagueError,
  ImportLeagueService,
  LeagueNotFoundError,
} from '../services/ImportLeagueService'

export class ImportController {
  private importLeagueService: ImportLeagueService

  constructor(importLeagueService: ImportLeagueService) {
    this.importLeagueService = importLeagueService
  }

  /**
   * Given a league code in the path it imports the league to the application database
   * @param req
   * @param res
   **/
  public importLeague = async (req: Request, res: Response) => {
    try {
      const { leagueCode } = req.params
      await this.importLeagueService.importLeague(leagueCode)
      res.status(200).send('League successfully imported to database')
    } catch (error) {
      if (
        error instanceof ExistingLeagueError ||
        error instanceof LeagueNotFoundError
      )
        res.status(400).send({
          error: error.message,
        })
      else
        res.status(500).send({
          error: 'Something went wrong',
        })
    }
  }
}
