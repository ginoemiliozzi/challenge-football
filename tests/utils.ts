import { Mock } from 'moq.ts'
import { TeamsRepository } from '../src/db/repositories/TeamsRepository'
import { CompetitionsRepository } from '../src/db/repositories/CompetitionsRepository'
import { MembersRepository } from '../src/db/repositories/MembersRepository'
import { TeamsCompetitionsRepository } from '../src/db/repositories/TeamsCompetitionsRepository'
import { FootballDataService } from '../src/services/FootballDataService'
import { ImportLeagueService } from '../src/services/ImportLeagueService'
import { AppDependencies } from '../app'

export const dummyAppDependenciesMocks: AppDependencies = {
  teamsRepository: new Mock<TeamsRepository>().object(),
  competitionsRepository: new Mock<CompetitionsRepository>().object(),
  membersRepository: new Mock<MembersRepository>().object(),
  teamsCompetitionsRepository: new Mock<TeamsCompetitionsRepository>().object(),
  footballDataService: new Mock<FootballDataService>().object(),
  importLeagueService: new Mock<ImportLeagueService>().object(),
}
