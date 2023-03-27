import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const main = async (): Promise<void> => {
  // Clear all data
  await prisma.playersOnMatches.deleteMany();
  await prisma.match.deleteMany();
  await prisma.player.deleteMany();
  await prisma.team.deleteMany();
  await prisma.season.deleteMany();
  await prisma.league.deleteMany();
  await prisma.sport.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const salt = await bcrypt.genSalt();
  const password = await bcrypt.hash('Aa@123456', salt);

  const [user01, user02] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'toan.doan@blackbook.ai',
        firstName: 'Toan',
        lastName: 'Doan',
        role: 'ADMIN',
        password,
        active: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'tyler.beutel@blackbook.ai',
        firstName: 'Tyler',
        lastName: 'Beutel',
        role: 'ADMIN',
        password,
        active: true,
      },
    }),
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
        email: 'user@isports,net',
        firstName: 'User',
        lastName: 'iSports',
        role: 'STAFF',
        password,
        active: true,
      },
    }),
  ]);

  // Create sports
  const sport = await prisma.sport.create({
    data: { name: 'Afl' },
  });

  // Create leagues
  const league = await prisma.league.create({
    data: {
      name: 'QAFL',
      sport: { connect: { id: sport.id } },
      createdUser: { connect: { id: user01.id } },
      updatedUser: { connect: { id: user02.id } },
    },
  });

  // Create seasons
  const season = await prisma.season.create({
    data: {
      name: '2021',
      league: { connect: { id: league.id } },
      createdUser: { connect: { id: user01.id } },
      updatedUser: { connect: { id: user02.id } },
    },
  });

  // Create teams
  const [broadbeach, aspley] = await Promise.all([
    prisma.team.create({
      data: {
        name: 'Broadbeach',
        season: { connect: { id: season.id } },
      },
    }),
    prisma.team.create({
      data: {
        name: 'Aspley',
        season: { connect: { id: season.id } },
      },
    }),
  ]);

  // Create home players
  const homePlayer01 = await prisma.player.create({
    data: {
      name: 'Player 01',
      teamId: broadbeach.id,
      playerNumber: 1,
    },
  });
  const homePlayer04 = await prisma.player.create({
    data: {
      name: 'Player 04',
      teamId: broadbeach.id,
      playerNumber: 4,
    },
  });
  const homePlayer05 = await prisma.player.create({
    data: {
      name: 'Player 05',
      teamId: broadbeach.id,
      playerNumber: 5,
    },
  });
  const homePlayer06 = await prisma.player.create({
    data: {
      name: 'Player 06',
      teamId: broadbeach.id,
      playerNumber: 6,
    },
  });
  const homePlayer07 = await prisma.player.create({
    data: {
      name: 'Player 07',
      teamId: broadbeach.id,
      playerNumber: 7,
    },
  });
  const homePlayer08 = await prisma.player.create({
    data: {
      name: 'Player 08',
      teamId: broadbeach.id,
      playerNumber: 8,
    },
  });
  const homePlayer09 = await prisma.player.create({
    data: {
      name: 'Player 09',
      teamId: broadbeach.id,
      playerNumber: 9,
    },
  });
  const homePlayer10 = await prisma.player.create({
    data: {
      name: 'Player 10',
      teamId: broadbeach.id,
      playerNumber: 10,
    },
  });
  const homePlayer12 = await prisma.player.create({
    data: {
      name: 'Player 12',
      teamId: broadbeach.id,
      playerNumber: 12,
    },
  });
  const homePlayer13 = await prisma.player.create({
    data: {
      name: 'Player 13',
      teamId: broadbeach.id,
      playerNumber: 13,
    },
  });
  const homePlayer17 = await prisma.player.create({
    data: {
      name: 'Player 17',
      teamId: broadbeach.id,
      playerNumber: 17,
    },
  });
  const homePlayer18 = await prisma.player.create({
    data: {
      name: 'Player 18',
      teamId: broadbeach.id,
      playerNumber: 18,
    },
  });
  const homePlayer22 = await prisma.player.create({
    data: {
      name: 'Player 22',
      teamId: broadbeach.id,
      playerNumber: 22,
    },
  });
  const homePlayer24 = await prisma.player.create({
    data: {
      name: 'Player 24',
      teamId: broadbeach.id,
      playerNumber: 24,
    },
  });
  const homePlayer27 = await prisma.player.create({
    data: {
      name: 'Player 27',
      teamId: broadbeach.id,
      playerNumber: 27,
    },
  });
  const homePlayer36 = await prisma.player.create({
    data: {
      name: 'Player 36',
      teamId: broadbeach.id,
      playerNumber: 36,
    },
  });
  const homePlayer37 = await prisma.player.create({
    data: {
      name: 'Player 37',
      teamId: broadbeach.id,
      playerNumber: 37,
    },
  });
  const homePlayer41 = await prisma.player.create({
    data: {
      name: 'Player 41',
      teamId: broadbeach.id,
      playerNumber: 41,
    },
  });
  const homePlayer43 = await prisma.player.create({
    data: {
      name: 'Player 43',
      teamId: broadbeach.id,
      playerNumber: 43,
    },
  });
  const homePlayer44 = await prisma.player.create({
    data: {
      name: 'Player 44',
      teamId: broadbeach.id,
      playerNumber: 44,
    },
  });
  const homePlayer54 = await prisma.player.create({
    data: {
      name: 'Player 54',
      teamId: broadbeach.id,
      playerNumber: 54,
    },
  });
  const homePlayer56 = await prisma.player.create({
    data: {
      name: 'Player 56',
      teamId: broadbeach.id,
      playerNumber: 56,
    },
  });

  // Create away players
  const awayPlayer01 = await prisma.player.create({
    data: {
      name: 'Player 01',
      teamId: aspley.id,
      playerNumber: 1,
    },
  });
  const awayPlayer03 = await prisma.player.create({
    data: {
      name: 'Player 03',
      teamId: aspley.id,
      playerNumber: 3,
    },
  });
  const awayPlayer04 = await prisma.player.create({
    data: {
      name: 'Player 04',
      teamId: aspley.id,
      playerNumber: 4,
    },
  });
  const awayPlayer06 = await prisma.player.create({
    data: {
      name: 'Player 06',
      teamId: aspley.id,
      playerNumber: 6,
    },
  });
  const awayPlayer07 = await prisma.player.create({
    data: {
      name: 'Player 07',
      teamId: aspley.id,
      playerNumber: 7,
    },
  });
  const awayPlayer09 = await prisma.player.create({
    data: {
      name: 'Player 09',
      teamId: aspley.id,
      playerNumber: 9,
    },
  });
  const awayPlayer10 = await prisma.player.create({
    data: {
      name: 'Player 10',
      teamId: aspley.id,
      playerNumber: 10,
    },
  });
  const awayPlayer11 = await prisma.player.create({
    data: {
      name: 'Player 11',
      teamId: aspley.id,
      playerNumber: 11,
    },
  });
  const awayPlayer12 = await prisma.player.create({
    data: {
      name: 'Player 12',
      teamId: aspley.id,
      playerNumber: 12,
    },
  });
  const awayPlayer13 = await prisma.player.create({
    data: {
      name: 'Player 13',
      teamId: aspley.id,
      playerNumber: 13,
    },
  });
  const awayPlayer14 = await prisma.player.create({
    data: {
      name: 'Player 14',
      teamId: aspley.id,
      playerNumber: 14,
    },
  });
  const awayPlayer18 = await prisma.player.create({
    data: {
      name: 'Player 18',
      teamId: aspley.id,
      playerNumber: 18,
    },
  });
  const awayPlayer20 = await prisma.player.create({
    data: {
      name: 'Player 20',
      teamId: aspley.id,
      playerNumber: 20,
    },
  });
  const awayPlayer22 = await prisma.player.create({
    data: {
      name: 'Player 22',
      teamId: aspley.id,
      playerNumber: 22,
    },
  });
  const awayPlayer24 = await prisma.player.create({
    data: {
      name: 'Player 24',
      teamId: aspley.id,
      playerNumber: 24,
    },
  });
  const awayPlayer25 = await prisma.player.create({
    data: {
      name: 'Player 25',
      teamId: aspley.id,
      playerNumber: 25,
    },
  });
  const awayPlayer28 = await prisma.player.create({
    data: {
      name: 'Player 28',
      teamId: aspley.id,
      playerNumber: 28,
    },
  });
  const awayPlayer33 = await prisma.player.create({
    data: {
      name: 'Player 33',
      teamId: aspley.id,
      playerNumber: 33,
    },
  });
  const awayPlayer39 = await prisma.player.create({
    data: {
      name: 'Player 39',
      teamId: aspley.id,
      playerNumber: 39,
    },
  });
  const awayPlayer43 = await prisma.player.create({
    data: {
      name: 'Player 43',
      teamId: aspley.id,
      playerNumber: 43,
    },
  });
  const awayPlayer44 = await prisma.player.create({
    data: {
      name: 'Player 44',
      teamId: aspley.id,
      playerNumber: 44,
    },
  });
  const awayPlayer45 = await prisma.player.create({
    data: {
      name: 'Player 45',
      teamId: aspley.id,
      playerNumber: 45,
    },
  });

  // Combine players into single array
  const homePlayers = [
    homePlayer01,
    homePlayer04,
    homePlayer05,
    homePlayer06,
    homePlayer07,
    homePlayer08,
    homePlayer09,
    homePlayer10,
    homePlayer12,
    homePlayer13,
    homePlayer17,
    homePlayer18,
    homePlayer22,
    homePlayer24,
    homePlayer27,
    homePlayer36,
    homePlayer37,
    homePlayer41,
    homePlayer43,
    homePlayer44,
    homePlayer54,
    homePlayer56,
  ];
  const awayPlayers = [
    awayPlayer01,
    awayPlayer03,
    awayPlayer04,
    awayPlayer06,
    awayPlayer07,
    awayPlayer09,
    awayPlayer10,
    awayPlayer11,
    awayPlayer12,
    awayPlayer13,
    awayPlayer14,
    awayPlayer18,
    awayPlayer20,
    awayPlayer22,
    awayPlayer24,
    awayPlayer25,
    awayPlayer28,
    awayPlayer33,
    awayPlayer39,
    awayPlayer43,
    awayPlayer44,
    awayPlayer45,
  ];

  // Create match
  const match = await prisma.match.create({
    data: {
      homeTeam: {
        connect: { id: broadbeach.id },
      },
      homeTeamCsv: '72c25681-cd58-4509-bdc2-a87d4c99bdc6.csv',
      awayTeam: {
        connect: { id: aspley.id },
      },
      awayTeamCsv: '4ffdb7fa-98ee-4dcf-8eaf-9cf42315fe6c.csv',
      round: 1,
      date: new Date('2021-03-06T12:00:00'),
      season: {
        connect: { id: season.id },
      },
      location: {
        create: { name: 'Broadbeach AFL Ground' },
      },
      aflResults: {
        createMany: {
          data: [
            {
              scorePrimary: 0,
              teamId: broadbeach.id,
            },
            {
              scorePrimary: 0,
              teamId: aspley.id,
            },
          ],
        },
      },
    },
  });

  // Add players to Game
  await prisma.playersOnMatches.createMany({
    data: [
      ...homePlayers.map((player) => ({
        matchId: match.id,
        teamId: broadbeach.id,
        playerId: player.id,
        playerNumber: player.playerNumber,
      })),
      ...awayPlayers.map((player) => ({
        matchId: match.id,
        teamId: aspley.id,
        playerId: player.id,
        playerNumber: player.playerNumber,
      })),
    ],
  });

  // AFL Result Property for Player
  await prisma.resultProperty.create({
    data: {
      name: 'Disposal Statistics',
      type: 'PLAYER',
      sportId: sport.id,
      children: {
        createMany: {
          data: [
            //
            'D',
            'E',
            'IE',
            'TO',
            'PER',
            'K',
            'KE',
            'K_IE',
            'K_TO',
            'K_PER',
            'HB',
            'HB_E',
            'HB_IE',
            'HB_TO',
            'HB_PER',
          ].map((s) => ({
            name: s,
            alias: s,
            type: 'PLAYER',
            sportId: sport.id,
          })),
        },
      },
    },
  });
  await prisma.resultProperty.create({
    data: {
      name: 'Clearances',
      type: 'PLAYER',
      sportId: sport.id,
      children: {
        createMany: {
          data: [
            //
            'CLR_BU',
            'CLR_CSB',
            'CLR_TI',
            'CLR',
          ].map((s) => ({
            name: s,
            alias: s,
            type: 'PLAYER',
            sportId: sport.id,
          })),
        },
      },
    },
  });
  await prisma.resultProperty.create({
    data: {
      name: 'Possessions & Marking',
      type: 'PLAYER',
      sportId: sport.id,
      children: {
        createMany: {
          data: [
            //
            'CP',
            'UP',
            'CM',
            'UM',
            'F50M',
            'INTM',
          ].map((s) => ({
            name: s,
            alias: s,
            type: 'PLAYER',
            sportId: sport.id,
          })),
        },
      },
    },
  });
  await prisma.resultProperty.create({
    data: {
      name: 'Other',
      type: 'PLAYER',
      sportId: sport.id,
      children: {
        createMany: {
          data: [
            //
            'HO',
            'HOTA',
            'T',
            'FK_F',
            'FK_A',
            'I50',
            'G',
            'B',
          ].map((s) => ({
            name: s,
            alias: s,
            type: 'PLAYER',
            sportId: sport.id,
          })),
        },
      },
    },
  });

  // AFL Result Property for Match
  await prisma.resultProperty.create({
    data: {
      name: 'Overview',
      type: 'MATCH',
      sportId: sport.id,
      children: {
        createMany: {
          data: [
            //
            'Disposals|D',
            'Kicks|K',
            'Handballs|HB',
            'K/H Ratio|KH',
            'Disposal %|D_PER',
            'Clangers|CL',
            'I50s|I50',
            'Sc %/I50|SC_PER',
            'Cont Poss|CONT_POSS',
            'Uncon Poss|UNCON_POSS',
            'Marks|M',
            'F50 Marks|F50_M',
            'Uncon M|UCM',
            'Cont M|CM',
            'Intercept M|IM',
            'Tackles|T',
            'Free Kicks|FK',
          ].map((s) => ({
            name: s.split('|')[0],
            alias: s.split('|')[1],
            type: 'MATCH',
            sportId: sport.id,
          })),
        },
      },
    },
  });
  await prisma.resultProperty.create({
    data: {
      name: 'Stoppage',
      type: 'MATCH',
      sportId: sport.id,
      children: {
        createMany: {
          data: [
            //
            'BU|BU',
            'CSB|CSB',
            'TI|TI',
            'Total CLR|TCLR',
            'Hit Outs|HO',
            'Hit Outs TA|HOTA',
          ].map((s) => ({
            name: s.split('|')[0],
            alias: s.split('|')[1],
            type: 'MATCH',
            sportId: sport.id,
          })),
        },
      },
    },
  });
  await prisma.resultProperty.create({
    data: {
      name: 'Offence',
      type: 'MATCH',
      sportId: sport.id,
      children: {
        createMany: {
          data: [
            //
            'I50s|I50S',
            'Sc %/I50|SC_PER',
            'Deep|I50_D',
            'Shallow|SH',
            'F50 Marks|F50_M',
            'R. Behinds|RB',
          ].map((s) => ({
            name: s.split('|')[0],
            alias: s.split('|')[1],
            type: 'MATCH',
            sportId: sport.id,
          })),
        },
      },
    },
  });
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);

    await prisma.$disconnect();

    process.exit(1);
  });
