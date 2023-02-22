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

  await prisma.user.create({
    data: {
      email: 'toan.doan@blackbook.ai',
      firstName: 'Toan',
      lastName: 'Doan',
      password,
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      email: 'tyler.beutel@blackbook.ai',
      firstName: 'Tyler',
      lastName: 'Beutel',
      password,
      active: true,
    },
  });

  // Create sports
  const sport = await prisma.sport.create({
    data: { name: 'Afl' },
  });

  // Create leagues
  const league = await prisma.league.create({
    data: {
      name: 'QAFL',
      sport: { connect: { id: sport.id } },
    },
  });

  // Create seasons
  const season = await prisma.season.create({
    data: {
      name: '2021',
      league: { connect: { id: league.id } },
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

  // Create away players
  const awayPlayer01 = await prisma.player.create({
    data: {
      name: 'Player 01',
      teamId: broadbeach.id,
      playerNumber: 1,
    },
  });
  const awayPlayer03 = await prisma.player.create({
    data: {
      name: 'Player 03',
      teamId: broadbeach.id,
      playerNumber: 3,
    },
  });
  const awayPlayer04 = await prisma.player.create({
    data: {
      name: 'Player 04',
      teamId: broadbeach.id,
      playerNumber: 4,
    },
  });
  const awayPlayer06 = await prisma.player.create({
    data: {
      name: 'Player 06',
      teamId: broadbeach.id,
      playerNumber: 6,
    },
  });
  const awayPlayer07 = await prisma.player.create({
    data: {
      name: 'Player 07',
      teamId: broadbeach.id,
      playerNumber: 7,
    },
  });
  const awayPlayer09 = await prisma.player.create({
    data: {
      name: 'Player 09',
      teamId: broadbeach.id,
      playerNumber: 9,
    },
  });
  const awayPlayer10 = await prisma.player.create({
    data: {
      name: 'Player 10',
      teamId: broadbeach.id,
      playerNumber: 10,
    },
  });
  const awayPlayer11 = await prisma.player.create({
    data: {
      name: 'Player 11',
      teamId: broadbeach.id,
      playerNumber: 11,
    },
  });
  const awayPlayer12 = await prisma.player.create({
    data: {
      name: 'Player 12',
      teamId: broadbeach.id,
      playerNumber: 12,
    },
  });
  const awayPlayer13 = await prisma.player.create({
    data: {
      name: 'Player 13',
      teamId: broadbeach.id,
      playerNumber: 13,
    },
  });
  const awayPlayer14 = await prisma.player.create({
    data: {
      name: 'Player 14',
      teamId: broadbeach.id,
      playerNumber: 14,
    },
  });
  const awayPlayer18 = await prisma.player.create({
    data: {
      name: 'Player 18',
      teamId: broadbeach.id,
      playerNumber: 18,
    },
  });
  const awayPlayer20 = await prisma.player.create({
    data: {
      name: 'Player 20',
      teamId: broadbeach.id,
      playerNumber: 20,
    },
  });
  const awayPlayer22 = await prisma.player.create({
    data: {
      name: 'Player 22',
      teamId: broadbeach.id,
      playerNumber: 22,
    },
  });
  const awayPlayer24 = await prisma.player.create({
    data: {
      name: 'Player 24',
      teamId: broadbeach.id,
      playerNumber: 24,
    },
  });
  const awayPlayer25 = await prisma.player.create({
    data: {
      name: 'Player 25',
      teamId: broadbeach.id,
      playerNumber: 25,
    },
  });
  const awayPlayer28 = await prisma.player.create({
    data: {
      name: 'Player 28',
      teamId: broadbeach.id,
      playerNumber: 28,
    },
  });
  const awayPlayer33 = await prisma.player.create({
    data: {
      name: 'Player 33',
      teamId: broadbeach.id,
      playerNumber: 33,
    },
  });
  const awayPlayer39 = await prisma.player.create({
    data: {
      name: 'Player 39',
      teamId: broadbeach.id,
      playerNumber: 39,
    },
  });
  const awayPlayer43 = await prisma.player.create({
    data: {
      name: 'Player 43',
      teamId: broadbeach.id,
      playerNumber: 43,
    },
  });
  const awayPlayer44 = await prisma.player.create({
    data: {
      name: 'Player 44',
      teamId: broadbeach.id,
      playerNumber: 44,
    },
  });
  const awayPlayer45 = await prisma.player.create({
    data: {
      name: 'Player 45',
      teamId: broadbeach.id,
      playerNumber: 45,
    },
  });

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

  // Combine players into single array
  const awayPlayers = [
    awayPlayer01.id,
    awayPlayer03.id,
    awayPlayer04.id,
    awayPlayer06.id,
    awayPlayer07.id,
    awayPlayer09.id,
    awayPlayer10.id,
    awayPlayer11.id,
    awayPlayer12.id,
    awayPlayer13.id,
    awayPlayer14.id,
    awayPlayer18.id,
    awayPlayer20.id,
    awayPlayer22.id,
    awayPlayer24.id,
    awayPlayer25.id,
    awayPlayer28.id,
    awayPlayer33.id,
    awayPlayer39.id,
    awayPlayer43.id,
    awayPlayer44.id,
    awayPlayer45.id,
  ];
  const homePlayers = [
    homePlayer01.id,
    homePlayer04.id,
    homePlayer05.id,
    homePlayer06.id,
    homePlayer07.id,
    homePlayer08.id,
    homePlayer09.id,
    homePlayer10.id,
    homePlayer12.id,
    homePlayer13.id,
    homePlayer17.id,
    homePlayer18.id,
    homePlayer22.id,
    homePlayer24.id,
    homePlayer27.id,
    homePlayer36.id,
    homePlayer37.id,
    homePlayer41.id,
    homePlayer43.id,
    homePlayer44.id,
    homePlayer54.id,
    homePlayer56.id,
  ];

  // Create match
  const match = await prisma.match.create({
    data: {
      homeTeam: {
        connect: { id: broadbeach.id },
      },
      awayTeam: {
        connect: { id: aspley.id },
      },
      round: 1,
      date: new Date('2021-03-06T12:00:00'),
      season: {
        connect: { id: season.id },
      },
      location: {
        create: { name: 'Broadbeach AFL Ground' },
      },
    },
  });

  // Add players to game
  await prisma.playersOnMatches.createMany({
    // data: homePlayers.concat(awayPlayers).map((playerId) => ({
    //   teamId: broadbeach.id,
    //   playerId: playerId,
    //   matchId: match.id,
    // })),
    data: [
      ...homePlayers.map((player) => ({
        matchId: match.id,
        playerId: player,
        teamId: broadbeach.id,
      })),
      ...awayPlayers.map((player) => ({
        matchId: match.id,
        playerId: player,
        teamId: aspley.id,
      })),
    ],
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
