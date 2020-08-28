const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')
const supertest = require('supertest')

describe.only('Protected endpoints', () => {

  let db
  const {
    testUsers,
    testThings,
    testReviews
  } = helpers.makeThingsFixtures()

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    })
    app.set('db', db)
  })

  before('clean tables', () => helpers.cleanTables(db))

  after('disconnect from db', () => db.destroy())

  afterEach('clean tables', () => helpers.cleanTables(db))

  beforeEach('seed tables', () => helpers.seedThingsTables(db, testUsers, testThings, testReviews ))

  const protectedEndpoints = [
    {
      name: 'GET /api/things/:thing_id',
      path: '/api/things/1',
      method: supertest(app).get
    },
    {
      name: 'GET /api/things/:thing_id/reviews',
      path: '/api/things/1/reviews',
      method: supertest(app).get
    },
    {
      name: 'POST /api/reviews',
      path: '/api/reviews',
      method: supertest(app).post
    }
  ]

  protectedEndpoints.forEach(endpoint => {
    describe(endpoint.name, () => {
      it('responds 401 "Missing bearer token" when no bearer token', () => {
        return endpoint.method(endpoint.path)
          .expect(401, {error: 'Missing bearer token' })
      })
      it('responds 401 "Unauthorized request" when invalid JWT_SECRET', () => {
        const validUser = testUsers[0]
        const invalidSecret = 'bad-secret'
        return endpoint.method(endpoint.path)
          .set('authorization', helpers.makeAuthHeader(validUser, invalidSecret))
          .expect(401, { error: 'Unauthorized request' })
      })
      it('responds 401 "Unauthorized request" when invalid username', () => {
        const invalidUser = { user_name: 'not-existy', password: 'valid' }
        return endpoint.method(endpoint.path)
          .set('authorization', helpers.makeAuthHeader(invalidUser))
          .expect(401, { error: 'Unauthorized request' })
      })
      it('responds 401 "Unauthorized request" when password is invalid', () => {
        const invalidPass = {user_name: testUsers[0].user_name, password: 'wrong' }
        return endpoint.method(endpoint.path)
          .set('authorization', helpers.makeAuthHeader(invalidPass))
          .expect(401, { error: 'Unauthorized request' })
      })
    })
  })
})