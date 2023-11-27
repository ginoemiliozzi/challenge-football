import * as express from 'express'
import { ImportController } from '../controllers/ImportController'

export class ImportRoutes {
  public router: express.Router = express.Router()

  constructor(importController: ImportController) {
    this.init(importController)
  }

  private init(importController: ImportController): void {
    this.router.get(`/importLeague/:leagueCode`, importController.importLeague)
  }
}
