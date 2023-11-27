import { date, integer, pgTable, serial, varchar } from 'drizzle-orm/pg-core'

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  sourceId: integer('sourceId').notNull(),
  shortName: varchar('shortName').notNull(),
  address: varchar('address').notNull(),
  areaName: varchar('areaName').notNull(),
  tla: varchar('tla').notNull(),
})
export type Team = typeof teams.$inferSelect
export type NewTeam = typeof teams.$inferInsert

export const competitions = pgTable('competitions', {
  id: serial('id').primaryKey(),
  sourceId: integer('sourceId').notNull(),
  name: varchar('name').notNull(),
  areaName: varchar('areaName').notNull(),
  code: varchar('code').notNull(),
})
export type Competition = typeof competitions.$inferSelect
export type NewCompetition = typeof competitions.$inferInsert

export const members = pgTable('members', {
  id: serial('id').primaryKey(),
  sourceId: integer('sourceId'),
  name: varchar('name'),
  position: varchar('position').notNull(),
  dateOfBirth: date('dateOfBirth'),
  nationality: varchar('nationality'),
  currentTeam: integer('currentTeam')
    .notNull()
    .references(() => teams.id),
})
export type Member = typeof members.$inferSelect
export type NewMember = typeof members.$inferInsert

export const teams_competitions = pgTable('teams_competitions', {
  competitionId: integer('competitionId')
    .primaryKey()
    .references(() => competitions.id),
  teamId: integer('teamId')
    .primaryKey()
    .references(() => teams.id),
})
export type TeamsCompetition = typeof teams_competitions.$inferSelect
