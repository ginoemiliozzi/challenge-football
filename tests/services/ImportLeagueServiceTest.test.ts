import LiveImportLeagueService from '../../src/services/ImportLeagueService'
import {
  FootballDataService,
  TeamMembersResponse,
  TeamResponse,
} from '../../src/services/FootballDataService'
import { TeamsRepository } from '../../src/db/repositories/TeamsRepository'
import { MembersRepository } from '../../src/db/repositories/MembersRepository'
import { CompetitionsRepository } from '../../src/db/repositories/CompetitionsRepository'
import { TeamsCompetitionsRepository } from '../../src/db/repositories/TeamsCompetitionsRepository'
import { Mock, It, Times } from 'moq.ts'
import {
  NewCompetition,
  NewMember,
  NewTeam,
  TeamsCompetition,
} from '../../src/db/schema'

describe('LiveImportLeagueService', () => {
  const NEW_COMPETITION = {
    id: 10,
    name: 'Superliga Argentina',
    code: 'AR',
    area: {
      name: 'Argentina',
    },
  }
  const EXISTING_TEAMS: TeamResponse[] = [
    {
      id: 1,
      shortName: "Newell's Old Boys",
      tla: 'NOB',
      address: 'Coloso del parque',
      area: {
        name: 'Rosario',
      },
      coach: {
        id: undefined,
        name: undefined,
        dateOfBirth: undefined,
        nationality: undefined,
      },
      squad: [],
    },
  ]
  const TEAM_2_MEMBERS: TeamMembersResponse = {
    coach: {
      id: undefined,
      name: undefined,
      dateOfBirth: undefined,
      nationality: undefined,
    },
    squad: [],
  }
  const TEAM_3_MEMBERS: TeamMembersResponse = {
    coach: {
      id: undefined,
      name: undefined,
      dateOfBirth: undefined,
      nationality: undefined,
    },
    squad: [
      {
        id: 11,
        name: 'Player 11',
        position: 'Forward',
        dateOfBirth: '1990-10-11',
        nationality: 'Argentina',
      },
    ],
  }
  const NON_EXISTING_TEAMS: TeamResponse[] = [
    {
      id: 2,
      shortName: 'Boca Juniors',
      tla: 'BOC',
      address: 'Bombonera',
      area: {
        name: 'Bs as',
      },
      ...TEAM_2_MEMBERS,
    },
    {
      id: 3,
      shortName: 'River Plate',
      tla: 'RIV',
      address: 'Monumental',
      area: {
        name: 'Bs as',
      },
      ...TEAM_3_MEMBERS,
    },
  ]
  const ALL_TEAMS = EXISTING_TEAMS.concat(NON_EXISTING_TEAMS)

  const footballDataServiceMock = new Mock<FootballDataService>()
    .setup((fds) => fds.getLeague('AR'))
    .returnsAsync(NEW_COMPETITION)
    .setup((fds) => fds.getLeagueTeams(10))
    .returnsAsync({
      teams: ALL_TEAMS,
    })

  const teamsRepoMock = new Mock<TeamsRepository>()
    .setup((tr) => tr.filterOutExistingBySourceId(It.IsAny<number[]>()))
    .returnsAsync([2, 3])
    .setup((tr) => tr.getIdsForSourceIds([1]))
    .returnsAsync([11])
    .setup((tr) => tr.insertMany(It.IsAny<NewTeam[]>()))
    .returnsAsync([22, 33])

  const membersRepoMock = new Mock<MembersRepository>()
    .setup((cr) => cr.insert(It.IsAny<NewMember>()))
    .returnsAsync(42)
    .setup((tr) => tr.insertMany(It.IsAny<NewMember[]>()))
    .returnsAsync([88, 99])

  const competitionsRepoMock = new Mock<CompetitionsRepository>()
    .setup((cr) => cr.insert(It.IsAny<NewCompetition>()))
    .returnsAsync(NEW_COMPETITION.id)

  const teamsCompetitionsRepoMock = new Mock<TeamsCompetitionsRepository>()
    .setup((tr) => tr.insertMany(It.IsAny<TeamsCompetition[]>()))
    .returnsAsync([88, 99])

  it('should import league without errors', async () => {
    const sut = new LiveImportLeagueService(
      footballDataServiceMock.object(),
      teamsRepoMock.object(),
      membersRepoMock.object(),
      competitionsRepoMock.object(),
      teamsCompetitionsRepoMock.object()
    )
    await sut.importLeague('AR')
  })

  it('should create competition', async () => {
    competitionsRepoMock.verify(
      (cr) =>
        cr.insert(It.Is((c: NewCompetition) => c.code == NEW_COMPETITION.code)),
      Times.Once()
    )
  })

  it('should create missing teams', async () => {
    teamsRepoMock.verify(
      (mr) =>
        mr.insertMany(
          It.Is((teams: NewTeam[]) => {
            return (
              teams.length === NON_EXISTING_TEAMS.length &&
              NON_EXISTING_TEAMS.map((p) => p.id).every((id) =>
                teams.map((p) => p.sourceId).includes(id)
              )
            )
          })
        ),
      Times.Once()
    )
  })

  it('should create members for new teams', async () => {
    membersRepoMock.verify(
      (mr) =>
        mr.insertMany(
          It.Is((players: NewMember[]) => {
            return (
              players.length === TEAM_3_MEMBERS.squad.length &&
              TEAM_3_MEMBERS.squad
                .map((p) => p.id)
                .every((id) => players.map((p) => p.sourceId).includes(id))
            )
          })
        ),
      Times.Once()
    )

    membersRepoMock.verify(
      (mr) =>
        mr.insert(
          It.Is((coach: NewMember) => {
            return coach.position === 'coach'
          })
        ),
      Times.Once()
    )
  })

  it('should create the teams competition relations for all teams', async () => {
    teamsCompetitionsRepoMock.verify(
      (tcr) =>
        tcr.insertMany(
          It.Is((teamComps: TeamsCompetition[]) => {
            return (
              teamComps.length === ALL_TEAMS.length &&
              teamComps.every((tc) => tc.competitionId === NEW_COMPETITION.id)
            )
          })
        ),
      Times.Once()
    )
  })
})
