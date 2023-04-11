import { Player, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as _ from 'lodash';
import { DateTime } from 'luxon';

const prisma = new PrismaClient();

const main = async (): Promise<void> => {
  const salt = await bcrypt.genSalt();
  const password = await bcrypt.hash('Aa@123456', salt);

  const [admin, staff] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@isports.net',
        firstName: 'Admin',
        lastName: 'iSports',
        role: 'ADMIN',
        password,
        active: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'user@isports.net',
        firstName: 'User',
        lastName: 'iSports',
        role: 'STAFF',
        password,
        active: true,
      },
    }),
  ]);

  const sport = await prisma.sport.create({
    data: { name: 'Afl' },
  });

  const league = await prisma.league.create({
    data: {
      name: 'QAFL',
      sport: { connect: { id: sport.id } },
      createdUser: { connect: { id: admin.id } },
      updatedUser: { connect: { id: staff.id } },
    },
  });

  const season = await prisma.season.create({
    data: {
      name: 'SS 2023',
      league: { connect: { id: league.id } },
      createdUser: { connect: { id: admin.id } },
      updatedUser: { connect: { id: staff.id } },
    },
  });

  const [homeTeam, awayTeam] = await Promise.all([
    prisma.team.create({
      data: {
        name: 'Labrador',
        season: { connect: { id: season.id } },
        players: {
          createMany: {
            data: _.times(100).map((i) => ({
              name: `Player ${_.padStart((i + 1).toString(), 2)}`,
              playerNumber: i + 1,
            })),
          },
        },
      },
      include: { players: true },
    }),
    prisma.team.create({
      data: {
        name: 'Maroochydore',
        season: { connect: { id: season.id } },
        players: {
          createMany: {
            data: _.times(100).map((i) => ({
              name: `Player ${_.padStart((i + 1).toString(), 2)}`,
              playerNumber: i + 1,
            })),
          },
        },
      },
      include: { players: true },
    }),
  ]);

  const resultProperties1 = await Promise.all([
    prisma.resultProperty.create({
      data: {
        name: 'Overview',
        alias: 'OVERVIEW',
        type: 'MATCH',
        sportId: sport.id,
        children: {
          createMany: {
            data: [
              'Disposals|DISPOSAL',
              'Kicks|KICKS',
              'Handballs|HANDBALLS',
              'K/H Ratio|KH_RATIO',
              'Disposal %|DISPOSAL_PER',
              'Clangers|CLANGERS',
              'I50s|I50S',
              'Sc %/I50|SC_PER_I50',
              'Cont Poss|CONT_POSS',
              'Uncon Poss|UNCON_POSS',
              'Marks|MARK',
              'F50 Marks|F50_MARKS',
              'Uncon M|UNCON_M',
              'Cont M|CONT_M',
              'Intercept M|INTERCEPT_M',
              'Tackles|TACKLES',
              'Free Kicks|FREE_KICKS',
            ].map((s) => ({
              name: s.split('|')[0],
              alias: s.split('|')[1],
              type: 'MATCH',
              sportId: sport.id,
            })),
          },
        },
      },
      include: { children: true },
    }),
    prisma.resultProperty.create({
      data: {
        name: 'Stoppage',
        alias: 'STOPPAGE',
        type: 'MATCH',
        sportId: sport.id,
        children: {
          createMany: {
            data: [
              'BU|BU',
              'CSB|CSB',
              'TI|TI',
              'Total CLR|TOTAL_CLR',
              'Hit Outs|HIT_OUTS',
              'Hit Outs TA|HIT_OUTS_TA',
            ].map((s) => ({
              name: s.split('|')[0],
              alias: s.split('|')[1],
              type: 'MATCH',
              sportId: sport.id,
            })),
          },
        },
      },
      include: { children: true },
    }),
    prisma.resultProperty.create({
      data: {
        name: 'Offence',
        alias: 'OFFENCE',
        type: 'MATCH',
        sportId: sport.id,
        children: {
          createMany: {
            data: [
              'I50s|I50S',
              'Sc %/I50|SC_PER_I50',
              'Deep|DEEP',
              'Shallow|SHALLOW',
              'F50 Marks|F50_MARKS',
              'R. Behinds|R_BEHINDS',
            ].map((s) => ({
              name: s.split('|')[0],
              alias: s.split('|')[1],
              type: 'MATCH',
              sportId: sport.id,
            })),
          },
        },
      },
      include: { children: true },
    }),
    prisma.resultProperty.create({
      data: {
        name: 'Possession',
        alias: 'POSSESSION',
        type: 'MATCH',
        sportId: sport.id,
        children: {
          createMany: {
            data: [
              'Loose Ball|LOOSE_BALL',
              'Hard Ball|HARD_BALL',
              'Frees For|FREES_FOR',
              'Cont M|COUNT_M',
              'Total Cont|TOTAL_CONT',
              'HB Rec|HB_REC',
              'Gathers|GATHERS',
              'Uncon M|UNCON_M',
              'Total Uncon|TOTAL_UNCON',
            ].map((s) => ({
              name: s.split('|')[0],
              alias: s.split('|')[1],
              type: 'MATCH',
              sportId: sport.id,
            })),
          },
        },
      },
      include: { children: true },
    }),
  ]);

  const resultProperties2 = await Promise.all([
    prisma.resultProperty.create({
      data: {
        name: 'Disposal Statistics',
        alias: 'DISPOSAL_STATISTICS',
        type: 'PLAYER',
        sportId: sport.id,
        children: {
          createMany: {
            data: [
              'D',
              'E|E_1',
              'IE|IE_1',
              'TO|TO_1',
              '%|PER_1',
              'K',
              'K E|E_2',
              'K IE|IE_2',
              'K TO|TO_2',
              '%|PER_2',
              'HB',
              'HB E|E_3',
              'HB IE|IE_3',
              'HB TO|TO_3',
              '%|PER_3',
            ].map((s) => ({
              name: s.split('|')[0],
              alias: s.includes('|') ? s.split('|')[1] : s.split('|')[0],
              type: 'PLAYER',
              sportId: sport.id,
            })),
          },
        },
      },
      include: { children: true },
    }),
    prisma.resultProperty.create({
      data: {
        name: 'Clearances',
        alias: 'CLEARANCES',
        type: 'PLAYER',
        sportId: sport.id,
        children: {
          createMany: {
            data: [
              'CLR BU|CLR_BU',
              'CLR CSB|CLR_CSB',
              'CLR TI|CLR_TI',
              'CLR',
            ].map((s) => ({
              name: s.split('|')[0],
              alias: s.includes('|') ? s.split('|')[1] : s.split('|')[0],
              type: 'PLAYER',
              sportId: sport.id,
            })),
          },
        },
      },
      include: { children: true },
    }),
    prisma.resultProperty.create({
      data: {
        name: 'Possessions & Marking',
        alias: 'POSSESSIONS_MARKING',
        type: 'PLAYER',
        sportId: sport.id,
        children: {
          createMany: {
            data: ['CP', 'UP', 'CM', 'UM', 'F50M', 'INTM'].map((s) => ({
              name: s.split('|')[0],
              alias: s.includes('|') ? s.split('|')[1] : s.split('|')[0],
              type: 'PLAYER',
              sportId: sport.id,
            })),
          },
        },
      },
      include: { children: true },
    }),
    prisma.resultProperty.create({
      data: {
        name: 'Other',
        alias: 'OTHER',
        type: 'PLAYER',
        sportId: sport.id,
        children: {
          createMany: {
            data: [
              'HO',
              'HOTA',
              'T',
              'FK F|FK_F',
              'FK A|FK_A',
              'I50',
              'G',
              'B',
            ].map((s) => ({
              name: s.split('|')[0],
              alias: s.includes('|') ? s.split('|')[1] : s.split('|')[0],
              type: 'PLAYER',
              sportId: sport.id,
            })),
          },
        },
      },
      include: { children: true },
    }),
  ]);

  const match = await prisma.match.create({
    data: {
      homeTeam: { connect: { id: homeTeam.id } },
      homeTeamCsv: 'df62dddf-47d6-47c8-a6f7-abe636abc139.csv',
      awayTeam: { connect: { id: awayTeam.id } },
      awayTeamCsv: 'b637f5d6-89a9-4fa4-a9b7-47d048d826c5.csv',
      round: 1,
      date: DateTime.fromSQL('2023-03-10 12:00:00').toJSDate(),
      season: { connect: { id: season.id } },
      location: { create: { name: 'Round PF' } },
      players: {
        createMany: {
          data: [
            ..._(homeTeam.players)
              .map((p) => ({
                playerId: p.id,
                teamId: homeTeam.id,
                playerNumber: p.playerNumber,
              }))
              .value(),
            ..._(awayTeam.players)
              .map((p) => ({
                playerId: p.id,
                teamId: awayTeam.id,
                playerNumber: p.playerNumber,
              }))
              .value(),
          ],
        },
      },
      reportsOnMatches: {
        createMany: {
          data: _.transform(
            resultProperties1,
            (results, p) => {
              _.forEach(p.children, (resultProperty) => {
                results.push({
                  resultPropertyId: resultProperty.id,
                  value: [
                    _.sample([0, 5, 10, 15, 20]),
                    _.sample([0, 5, 10, 15, 20]),
                    _.sample([0, 5, 10, 15, 20]),
                  ],
                });
              });
            },
            [],
          ),
        },
      },
    },
  });

  await Promise.all([
    prisma.teamReport.create({
      data: {
        matchId: match.id,
        teamId: homeTeam.id,
        score: _.sample([10, 15, 20]),
        meta: { RUSHED: 0 },
        playersOnTeamReports: {
          createMany: {
            data: _.transform<
              Player,
              {
                playerId: number;
                resultPropertyId: number;
                value: number;
              }[]
            >(
              homeTeam.players,
              (results, player) => {
                _.forEach(resultProperties2, (p) => {
                  _.forEach(p.children, (resultProperty) => {
                    results.push({
                      playerId: player.id,
                      resultPropertyId: resultProperty.id,
                      value: _.sample([1, 0]),
                    });
                  });
                });
              },
              [],
            ),
          },
        },
      },
    }),
    prisma.teamReport.create({
      data: {
        matchId: match.id,
        teamId: awayTeam.id,
        score: _.sample([10, 15, 20]),
        meta: { RUSHED: 0 },
        playersOnTeamReports: {
          createMany: {
            data: _.transform<
              Player,
              {
                playerId: number;
                resultPropertyId: number;
                value: number;
              }[]
            >(
              awayTeam.players,
              (results, player) => {
                _.forEach(resultProperties2, (p) => {
                  _.forEach(p.children, (resultProperty) => {
                    results.push({
                      playerId: player.id,
                      resultPropertyId: resultProperty.id,
                      value: _.sample([1, 0]),
                    });
                  });
                });
              },
              [],
            ),
          },
        },
      },
    }),
  ]);
};

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);

    await prisma.$disconnect();

    process.exit(1);
  });
