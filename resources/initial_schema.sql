-- Create teams table
CREATE TABLE teams (
    "id" SERIAL PRIMARY KEY,
    "sourceId" INTEGER NOT NULL,
    "shortName" VARCHAR(255) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "areaName" VARCHAR(255) NOT NULL,
    "tla" VARCHAR(255) NOT NULL
);

-- Create competitions table
CREATE TABLE competitions (
    "id" SERIAL PRIMARY KEY,
    "sourceId" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "areaName" VARCHAR(255) NOT NULL,
    "code" VARCHAR(255) NOT NULL
);

-- Create members table
CREATE TABLE members (
    "id" SERIAL PRIMARY KEY,
    "sourceId" INTEGER,
    "name" VARCHAR(255),
    "position" VARCHAR(255) NOT NULL,
    "dateOfBirth" DATE,
    "nationality" VARCHAR(255),
    "currentTeam" INTEGER REFERENCES teams ("id")
);

-- Create teams_competitions table
CREATE TABLE teams_competitions (
    "competitionId" INTEGER REFERENCES competitions ("id"),
    "teamId" INTEGER REFERENCES teams ("id"),
    PRIMARY KEY ("competitionId", "teamId")
);
