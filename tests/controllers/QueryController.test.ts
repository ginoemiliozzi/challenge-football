import request from 'supertest'
import { App } from '../../app'
import { dummyAppDependenciesMocks } from '../utils'
import { It, Mock } from 'moq.ts'
import { TeamsRepository } from '../../src/db/repositories/TeamsRepository'
import { Member, Team } from '../../src/db/schema'
import {
  MembersRepository,
  TeamMembers,
} from '../../src/db/repositories/MembersRepository'

const EXISTING_TEAM: Team = {
  id: 1,
  shortName: 'Arsenal',
  address: 'Arsenal',
  tla: 'ARS',
  areaName: 'England',
  sourceId: 22,
}

const EXISTING_TEAM_MEMBERS: TeamMembers = {
  teamId: 1,
  teamName: 'Arsenal',
  members: [
    {
      id: 10,
      sourceId: 11,
      name: 'Lionel Messi',
      position: 'Offence',
      dateOfBirth: '2001-01-24',
      nationality: 'Argentina',
      currentTeam: 1,
    },
  ],
}

const EXISTING_TEAM_WITH_MEMBERS = {
  ...EXISTING_TEAM,
  members: EXISTING_TEAM_MEMBERS.members,
}

describe('GET /query/teams/:teamName', () => {
  const teamRepositoryMock = new Mock<TeamsRepository>()
    .setup((tr) => tr.getByName('arsenal'))
    .returnsAsync(EXISTING_TEAM)
    .setup((tr) => tr.getByName('other'))
    .returnsAsync(undefined)

  const membersRepositoryMock = new Mock<MembersRepository>()
    .setup((mr) => mr.getMembersForTeams(It.IsAny()))
    .returnsAsync([EXISTING_TEAM_MEMBERS])

  const testAppDeps = {
    ...dummyAppDependenciesMocks,
    teamsRepository: teamRepositoryMock.object(),
    membersRepository: membersRepositoryMock.object(),
  }
  const testApp = new App(testAppDeps)

  it('should return the team if exists', async () => {
    return request(testApp.expressApp)
      .get('/query/teams/arsenal')
      .expect(200)
      .then((res) => {
        expect(res.body).toStrictEqual(EXISTING_TEAM)
      })
  })

  it('should return the team with members if required in query param', async () => {
    return request(testApp.expressApp)
      .get('/query/teams/arsenal?members=true')
      .expect(200)
      .then((res) => {
        expect(res.body).toStrictEqual(EXISTING_TEAM_WITH_MEMBERS)
      })
  })

  it('should return 404 if team does not exist', async () => {
    return request(testApp.expressApp).get('/query/teams/other').expect(404)
  })
})
