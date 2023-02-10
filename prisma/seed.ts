import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create sport
  const sport = await prisma.sport.create({
    data: { name: 'Afl' },
  });

  // Create leagues
  const qafl = await prisma.league.create({
    data: {
      name: 'QAFL',
      sportId: sport.id,
    },
  });

  // Create season
  const qaflSeason = await prisma.season.create({
    data: {
      name: '2021',
      leagueId: qafl.id,
    },
  });

  // Create teams
  const broadbeach = await prisma.teams.create({
    data: {
      name: 'Broadbeach',
      seasonId: qaflSeason.id,
    },
  });
  const aspley = await prisma.teams.create({
    data: {
      name: 'Aspley',
      seasonId: qaflSeason.id,
    },
  });

  // Create players
  // Home players
  const awayPlayer01 = await prisma.players.create({
    data: { name: 'Player 01', teamId: broadbeach.id, playerNumber: 1 },
  });
  const awayPlayer03 = await prisma.players.create({
    data: { name: 'Player 03', teamId: broadbeach.id, playerNumber: 3 },
  });
  const awayPlayer04 = await prisma.players.create({
    data: { name: 'Player 04', teamId: broadbeach.id, playerNumber: 4 },
  });
  const awayPlayer06 = await prisma.players.create({
    data: { name: 'Player 06', teamId: broadbeach.id, playerNumber: 6 },
  });
  const awayPlayer07 = await prisma.players.create({
    data: { name: 'Player 07', teamId: broadbeach.id, playerNumber: 7 },
  });
  const awayPlayer09 = await prisma.players.create({
    data: { name: 'Player 09', teamId: broadbeach.id, playerNumber: 9 },
  });
  const awayPlayer10 = await prisma.players.create({
    data: { name: 'Player 10', teamId: broadbeach.id, playerNumber: 10 },
  });
  const awayPlayer11 = await prisma.players.create({
    data: { name: 'Player 11', teamId: broadbeach.id, playerNumber: 11 },
  });
  const awayPlayer12 = await prisma.players.create({
    data: { name: 'Player 12', teamId: broadbeach.id, playerNumber: 12 },
  });
  const awayPlayer13 = await prisma.players.create({
    data: { name: 'Player 13', teamId: broadbeach.id, playerNumber: 13 },
  });
  const awayPlayer14 = await prisma.players.create({
    data: { name: 'Player 14', teamId: broadbeach.id, playerNumber: 14 },
  });
  const awayPlayer18 = await prisma.players.create({
    data: { name: 'Player 18', teamId: broadbeach.id, playerNumber: 18 },
  });
  const awayPlayer20 = await prisma.players.create({
    data: { name: 'Player 20', teamId: broadbeach.id, playerNumber: 20 },
  });
  const awayPlayer22 = await prisma.players.create({
    data: { name: 'Player 22', teamId: broadbeach.id, playerNumber: 22 },
  });
  const awayPlayer24 = await prisma.players.create({
    data: { name: 'Player 24', teamId: broadbeach.id, playerNumber: 24 },
  });
  const awayPlayer25 = await prisma.players.create({
    data: { name: 'Player 25', teamId: broadbeach.id, playerNumber: 25 },
  });
  const awayPlayer28 = await prisma.players.create({
    data: { name: 'Player 28', teamId: broadbeach.id, playerNumber: 28 },
  });
  const awayPlayer33 = await prisma.players.create({
    data: { name: 'Player 33', teamId: broadbeach.id, playerNumber: 33 },
  });
  const awayPlayer39 = await prisma.players.create({
    data: { name: 'Player 39', teamId: broadbeach.id, playerNumber: 39 },
  });
  const awayPlayer43 = await prisma.players.create({
    data: { name: 'Player 43', teamId: broadbeach.id, playerNumber: 43 },
  });
  const awayPlayer44 = await prisma.players.create({
    data: { name: 'Player 44', teamId: broadbeach.id, playerNumber: 44 },
  });
  const awayPlayer45 = await prisma.players.create({
    data: { name: 'Player 45', teamId: broadbeach.id, playerNumber: 45 },
  });

  // Home players
  const homePlayer01 = await prisma.players.create({
    data: { name: 'Player 01', teamId: broadbeach.id, playerNumber: 1 },
  });
  const homePlayer04 = await prisma.players.create({
    data: { name: 'Player 04', teamId: broadbeach.id, playerNumber: 4 },
  });
  const homePlayer05 = await prisma.players.create({
    data: { name: 'Player 05', teamId: broadbeach.id, playerNumber: 5 },
  });
  const homePlayer06 = await prisma.players.create({
    data: { name: 'Player 06', teamId: broadbeach.id, playerNumber: 6 },
  });
  const homePlayer07 = await prisma.players.create({
    data: { name: 'Player 07', teamId: broadbeach.id, playerNumber: 7 },
  });
  const homePlayer08 = await prisma.players.create({
    data: { name: 'Player 08', teamId: broadbeach.id, playerNumber: 8 },
  });
  const homePlayer09 = await prisma.players.create({
    data: { name: 'Player 09', teamId: broadbeach.id, playerNumber: 9 },
  });
  const homePlayer10 = await prisma.players.create({
    data: { name: 'Player 10', teamId: broadbeach.id, playerNumber: 10 },
  });
  const homePlayer12 = await prisma.players.create({
    data: { name: 'Player 12', teamId: broadbeach.id, playerNumber: 12 },
  });
  const homePlayer13 = await prisma.players.create({
    data: { name: 'Player 13', teamId: broadbeach.id, playerNumber: 13 },
  });
  const homePlayer17 = await prisma.players.create({
    data: { name: 'Player 17', teamId: broadbeach.id, playerNumber: 17 },
  });
  const homePlayer18 = await prisma.players.create({
    data: { name: 'Player 18', teamId: broadbeach.id, playerNumber: 18 },
  });
  const homePlayer22 = await prisma.players.create({
    data: { name: 'Player 22', teamId: broadbeach.id, playerNumber: 22 },
  });
  const homePlayer24 = await prisma.players.create({
    data: { name: 'Player 24', teamId: broadbeach.id, playerNumber: 24 },
  });
  const homePlayer27 = await prisma.players.create({
    data: { name: 'Player 27', teamId: broadbeach.id, playerNumber: 27 },
  });
  const homePlayer36 = await prisma.players.create({
    data: { name: 'Player 36', teamId: broadbeach.id, playerNumber: 36 },
  });
  const homePlayer37 = await prisma.players.create({
    data: { name: 'Player 37', teamId: broadbeach.id, playerNumber: 37 },
  });
  const homePlayer41 = await prisma.players.create({
    data: { name: 'Player 41', teamId: broadbeach.id, playerNumber: 41 },
  });
  const homePlayer43 = await prisma.players.create({
    data: { name: 'Player 43', teamId: broadbeach.id, playerNumber: 43 },
  });
  const homePlayer44 = await prisma.players.create({
    data: { name: 'Player 44', teamId: broadbeach.id, playerNumber: 44 },
  });
  const homePlayer54 = await prisma.players.create({
    data: { name: 'Player 54', teamId: broadbeach.id, playerNumber: 54 },
  });
  const homePlayer56 = await prisma.players.create({
    data: { name: 'Player 56', teamId: broadbeach.id, playerNumber: 56 },
  });

  // Combine players into single array
  const awayPlayers = [
    { id: awayPlayer01.id },
    { id: awayPlayer03.id },
    { id: awayPlayer04.id },
    { id: awayPlayer06.id },
    { id: awayPlayer07.id },
    { id: awayPlayer09.id },
    { id: awayPlayer10.id },
    { id: awayPlayer11.id },
    { id: awayPlayer12.id },
    { id: awayPlayer13.id },
    { id: awayPlayer14.id },
    { id: awayPlayer18.id },
    { id: awayPlayer20.id },
    { id: awayPlayer22.id },
    { id: awayPlayer24.id },
    { id: awayPlayer25.id },
    { id: awayPlayer28.id },
    { id: awayPlayer33.id },
    { id: awayPlayer39.id },
    { id: awayPlayer43.id },
    { id: awayPlayer44.id },
    { id: awayPlayer45.id },
  ];
  const homePlayers = [
    { id: homePlayer01.id },
    { id: homePlayer04.id },
    { id: homePlayer05.id },
    { id: homePlayer06.id },
    { id: homePlayer07.id },
    { id: homePlayer08.id },
    { id: homePlayer09.id },
    { id: homePlayer10.id },
    { id: homePlayer12.id },
    { id: homePlayer13.id },
    { id: homePlayer17.id },
    { id: homePlayer18.id },
    { id: homePlayer22.id },
    { id: homePlayer24.id },
    { id: homePlayer27.id },
    { id: homePlayer36.id },
    { id: homePlayer37.id },
    { id: homePlayer41.id },
    { id: homePlayer43.id },
    { id: homePlayer44.id },
    { id: homePlayer54.id },
    { id: homePlayer56.id },
  ];

  // Create match
  const match = await prisma.matches.create({
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
        connect: { id: qaflSeason.id },
      },
      location: {
        create: {
          name: 'Broadbeach AFL Ground',
        },
      },
    },
  });

  // Add players to game
  await prisma.playersOnMatches.createMany({
    data: [
      ...homePlayers.map((player) => ({
        matchId: match.id,
        playerId: player.id,
        teamId: broadbeach.id,
      })),
      ...awayPlayers.map((player) => ({
        matchId: match.id,
        playerId: player.id,
        teamId: aspley.id,
      })),
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
