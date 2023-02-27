process.env.NODE_ENV = 'test';
import { PrismaService } from 'nestjs-prisma';
import { LeaguesModule } from 'src/leagues/leagues.module';

import { LeaguesController } from '../src/leagues/leagues.controller';
import { LeaguesService } from '../src/leagues/leagues.service';

const chai = require('chai');
const chaiHttp = require('chai-http');

const expect = chai.expect;
const should = chai.should();
chai.use(chaiHttp);

const server = 'http://localhost:3000/api';

describe('Books', () => {
  let leaguesController: LeaguesController;
  let leaguesService: LeaguesService;
  let prismaService: PrismaService;
  beforeEach(async () => {
    prismaService = new PrismaService();
    leaguesService = new LeaguesService(prismaService);
    leaguesController = new LeaguesController(leaguesService);

    await prismaService.league.deleteMany();
  });

  /*
   * Test the /GET route
   */
  describe('/GET leagues', () => {
    it('it should GET all the leagues', async () => {
      const res = await prismaService.league.findMany({
        include: { sport: true },
      });

      expect(res.length).to.equal(0);
    });
  });

  /*
   * Test the /POST route
   */
  describe('/POST league', () => {
    it('it should not POST a league without sportId field', (done) => {
      const league = {
        name: 'VLeague',
      };
      chai
        .request(server)
        .post('/leagues')
        .send(league)
        .end((err, res) => {
          res.should.have.status(400);
          done();
        });
    });

    it('it should POST a league', (done) => {
      const league = {
        name: 'VLeague',
        sportId: 1,
      };
      chai
        .request(server)
        .post('/leagues')
        .send(league)
        .end((err, res) => {
          res.should.have.status(201);
          res.body.should.be.a('object');
          res.body.should.have.property('name');
          res.body.should.have.property('sportId');
          res.body.should.have.property('id');
          done();
        });
    });
  });

  /*
   * Test the /GET/:id route
   */
  describe('/GET/:id league', () => {
    it('it should GET a league by the given id', async () => {
      const league = {
        name: 'VLeague',
        sportId: 1,
      };
      const newLeague = await prismaService.league.create({
        data: {
          name: league.name,
          sport: {
            connect: { id: league.sportId },
          },
        },
      });

      const res = await chai.request(server).get('/leagues/' + newLeague.id);

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.should.have.property('name');
      res.body.should.have.property('sportId');
      res.body.should.have.property('id').eql(newLeague.id);
    });
  });
});
