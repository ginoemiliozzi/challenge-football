import express from 'express'
import cors from 'cors'
import LiveTeamsRepository, {
  TeamsRepository,
} from './src/db/repositories/TeamsRepository'
import LiveCompetitionsRepository, {
  CompetitionsRepository,
} from './src/db/repositories/CompetitionsRepository'
import LiveMembersRepository, {
  MembersRepository,
} from './src/db/repositories/MembersRepository'
import LiveTeamsCompetitionsRepository, {
  TeamsCompetitionsRepository,
} from './src/db/repositories/TeamsCompetitionsRepository'
import LiveFootballDataService, {
  FootballDataService,
} from './src/services/FootballDataService'
import LiveImportLeagueService, {
  ImportLeagueService,
} from './src/services/ImportLeagueService'
import getDatabaseConnection from './src/db/data-source'
import { ImportController } from './src/controllers/ImportController'
import { QueryController } from './src/controllers/QueryController'
import { ImportRoutes } from './src/routes/ImportRoutes'
import { QueryRoutes } from './src/routes/QueryRoutes'
import { rateLimit } from 'express-rate-limit'

export interface AppDependencies {
  teamsRepository: TeamsRepository
  competitionsRepository: CompetitionsRepository
  membersRepository: MembersRepository
  teamsCompetitionsRepository: TeamsCompetitionsRepository
  footballDataService: FootballDataService
  importLeagueService: ImportLeagueService
}

export class App {
  public expressApp: express.Application
  public dependencies: AppDependencies

  constructor(dependencies: AppDependencies) {
    this.expressApp = express()
    this.dependencies = dependencies

    this.config()
  }

  private config(): void {
    this.expressApp.use(cors())

    // Routing
    // Root
    this.expressApp.get('/', (req, res) => {
      res.send(
        'Please use the /import/importLeague/:leagueCode route to import a league and /query/players/:leagueCode or /query/teams/:name routes to request imported data'
      )
    })

    // Import league
    const importController = new ImportController(
      this.dependencies.importLeagueService
    )
    const importRoutes = new ImportRoutes(importController)
    const limiter = rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute
      limit: 5, // Free API limit is 10/min - we perform 2 requests each time we import
      message:
        'Given to limitations with the free football-data.org API key we cannot import a league now. Please wait a minute and try again.',
    })
    this.expressApp.use('/import', limiter, importRoutes.router)

    // Query data
    const queryController = new QueryController(
      this.dependencies.teamsRepository,
      this.dependencies.competitionsRepository,
      this.dependencies.membersRepository,
      this.dependencies.teamsCompetitionsRepository
    )
    const queryRoutes = new QueryRoutes(queryController)
    this.expressApp.use('/query', queryRoutes.router)
  }
}

export default function () {
  // Instantiate app dependencies
  const dbConnection = getDatabaseConnection()
  const teamsRepository = new LiveTeamsRepository(dbConnection)
  const competitionsRepository = new LiveCompetitionsRepository(dbConnection)
  const membersRepository = new LiveMembersRepository(dbConnection)
  const teamsCompetitionsRepository = new LiveTeamsCompetitionsRepository(
    dbConnection
  )
  const footballDataService = new LiveFootballDataService()
  const importLeagueService = new LiveImportLeagueService(
    footballDataService,
    teamsRepository,
    membersRepository,
    competitionsRepository,
    teamsCompetitionsRepository
  )

  return new App({
    teamsRepository,
    competitionsRepository,
    membersRepository,
    teamsCompetitionsRepository,
    footballDataService,
    importLeagueService,
  })
}
