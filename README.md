# Football data challenge

## General overview

The application interacts with the [football-data.org](http://www.football-data.org/) API to import data to a local database and expose information about football leagues, teams, players, and coaches.

## Tech overview

Regarding technologies:

- TypeScript
- Expressjs
- PostgreSQL
- Drizzle ORM
- Axios
- Docker

Regarding the code structure:
The application has two sets of routes `/import` and `/query` and each one has its correspondent controller. The /import routes use a middleware to limit the requests per minute, the limit is set to 5/min given that it takes 2 football data requests to import a league and the free tier allows 10req/min.

There are two services, `FootballDataService` is in charge of the communication with the football-data API and `ImportLeagueService` contains the bussines logic to import a league.

The communication with the database is performed through repository classes, there is one repository for each table in the db.

Dependency injection via constructors is being used for improved maintainability and testability.

## HTTP endpoints

The application has 3 endpoints in total:

#### `/import/importLeague/:leagueCode`

This endpoint takes a league code (PL, CL, etc) and uses http://www.football-data.org API to retrieve the league, participating teams and members for each team (players or coach if players are not present).

Returns an error message if the league is already imported or is not found in the API.

#### `/query/team/:teamName`

This endpoint takes a name and retrieves the corresponding team (case insensitive but full match).

If a query parameter `members` is sent with any value different than "false", it will also return the members for the matching team (players/coach).
If the parameter is not present or has value "false" only the team will be returned.

#### `/query/players/:leagueCode`

This endpoint takes a league code (PL, CL, etc) and returns all the players participating in that competition. Players are grouped by team.

If a query parameter `name` is used, it will also filter players by name using case insensitive partial match.

## How to run

#### Prerequisites

- Node.js
- npm
- nodemon
- docker compose

#### Steps

In the project root directory:

- In one terminal `docker compose up`

The docker container creates and exposes a postgresql database, it will also generate the database and initial schema the first time you run it.

- In a different terminal `npm install` and then `npm run dev`

This starts the web server using nodemon to react to changes in dev mode. Alternatively you can `npm run build` and `npm run start`

- That's it!

## Tests

To run: `npm run test`

Under /test folder there are two examples of unit tests:

- `services/ImportLeagueServiceTest.test.ts` Testing the service in charge to import the data
- `controllers/QueryController.test.ts` Testing the endpoint to retrieve the data from database

Both tests use mocked dependencies and do not interact with a real database or API.
