# iSports Review Portal

## Quick Links

[Quickstart](#quickstart)

[Scripts](#scripts)

[Testing](#testing)

[Azure Devops Board](https://dev.azure.com/bb-foundry/iSports/_boards/board/t/iSports%20Team/Stories)

[iSports Wireframes](https://xd.adobe.com/view/b6ce6e11-e512-434f-b559-9f565233c9e7-e39d/screen/fc0cfcf7-e969-4b67-aeee-bc1bc18edd2c/)

## Quickstart

### Setting up

Please use gitbash terminal for the following scripts.

Database

1. Setup PgAdmin
2. Create a database (we’re using v14)

Backend

1. Clone
2. Run `yarn` to install
3. Run `yarn prisma migrate dev` to setup database
4. Run `yarn prisma db seed` to populate db with test data
5. Run `yarn run start:dev` to run backend

### Working with the repo

START

1. Run `git fetch` to get updated information from repo.
2. Create a feature branch from origin\develop.

WORKING
Ensure your branch is regularly updated with `develop` branch.

1. Run `git fetch` to get updated information from repo.
2. Merge `develop` into your feature branch and fix any merge requests.
3. Test your branch to make sure it is still working.

FINISH

1. Run `git fetch` to get updated information from repo.
2. Merge `develop` into your feature branch and fix any merge requests.
3. Test your branch to make sure it is still working.4. Create pull request (great time to double check what changes are being made)

## Scripts

## Testing
