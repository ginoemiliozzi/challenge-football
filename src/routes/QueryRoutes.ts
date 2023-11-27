import * as express from 'express'
import { QueryController } from '../controllers/QueryController'

export class QueryRoutes {
  public router: express.Router = express.Router()

  constructor(queryController: QueryController) {
    this.init(queryController)
  }

  private init(queryController: QueryController): void {
    this.router.get(`/players/:leagueCode`, queryController.players)

    this.router.get(`/teams/:name`, queryController.teams)
  }
}
