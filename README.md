# iSports API


## Quick links 

[Overview](#overview)

[Quickstart](#quickstart)

[Testing](#testing)


## Overview

This is the backend API for the iSports application. It is built using the following technology:

| Technology | Description |
| ---------- | ----------- |
| [NestJS](https://nestjs.com/) | Opinionated Node.js backend framework. |
| [PostgreSQL](https://www.postgresql.org/) | Open source relational database. |
| [Prisma](https://www.prisma.io/) | ORM for Node.js and TypeScript. |


## Quickstart

### 1. Clone the repo
Clone the `isports-api` repository to your computer.

### 2. Install dependencies
Run `npm install` to install the project's necessary dependencies.

### 3. Setup the database (optional)
TBA

### 3. Configure 
Configure the variables in the env files you wish to use. This will ensure that the database, authentication, aws, and other integrations are connected properly.

### 4. Start the server
Run `npm run start:dev` to start the application in development mode. 



## Testing

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
