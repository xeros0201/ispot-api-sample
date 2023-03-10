process.env.NODE_ENV = 'test';
import chaiHttp = require('chai-http');

import * as chai from 'chai';
import { PrismaService } from 'nestjs-prisma';
import { LeaguesModule } from 'src/leagues/leagues.module';

import { LeaguesController } from '../src/leagues/leagues.controller';
import { LeaguesService } from '../src/leagues/leagues.service';
import { UsersService } from '../src/users/users.service';

const expect = chai.expect;
const should = chai.should();
chai.use(chaiHttp);

const server = 'http://localhost:3000/api';

describe('Leagues', () => {
  let leaguesController: LeaguesController;
  let leaguesService: LeaguesService;
  let usersService: UsersService;
  let prismaService: PrismaService;
  let Cookies;
  beforeEach(async () => {
    prismaService = new PrismaService();
    usersService = new UsersService(prismaService);
    leaguesService = new LeaguesService(prismaService);
    leaguesController = new LeaguesController(leaguesService);

    await prismaService.league.deleteMany({
      where: {
        NOT: {
          id: 1,
        },
      },
    });
  });

  describe('Login', () => {
    it('should create user session for valid user', async function () {
      const data = {
        email: 'tyler.beutel@blackbook.ai',
        firstName: 'Tyler',
        lastName: 'Beutel',
        password: 'Aa@123456',
        active: true,
      };
      // await usersService.create(data);

      const res = await chai.request(server).post('/auth/login').send({
        email: data.email,
        password: data.password,
      });

      res.should.have.status(200);
      res.body.should.have.property('id');
      res.body.firstName.should.equal(data.firstName);
      res.body.email.should.equal(data.email);
      // Save the cookie to use it later to retrieve the session
      Cookies = res.header['set-cookie'].pop().split(';')[0];
    });
  });

  /*
   * Test the /GET route
   */
  describe('/GET leagues', () => {
    it('it should GET all the leagues', async () => {
      const res = await prismaService.league.findMany({
        include: { sport: true },
      });

      expect(res.length).to.equal(1);
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
      const req = chai.request(server).post('/leagues');
      // Set cookie to get saved user session
      req.cookies = Cookies;
      req.send(league).end((err, res) => {
        res.should.have.status(400);
        done();
      });
    });

    it('it should POST a league', (done) => {
      const league = {
        name: 'VLeague',
        sportId: 1,
      };
      const req = chai.request(server).post('/leagues');
      // Set cookie to get saved user session
      req.cookies = Cookies;
      req.send(league).end((err, res) => {
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

      const req = chai.request(server).get('/leagues/' + newLeague.id);
      // Set cookie to get saved user session
      req.cookies = Cookies;
      const res = await req;

      res.should.have.status(200);
      res.body.should.be.a('object');
      res.body.should.have.property('id');
      res.body.should.have.property('name');
      res.body.should.have.property('sportId');
      res.body.should.have.property('id').eql(newLeague.id);
    });
  });
});
