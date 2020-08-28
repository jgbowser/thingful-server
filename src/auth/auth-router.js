const express = require('express')
const AuthService = require('./auth-services')

const authRouter = express.Router()
const jsonBodyParser = express.json()

authRouter
  .route('/login')
  .post(jsonBodyParser, (req, res, next) => {
    const { user_name, password } = req.body
    const userLogin = { user_name, password }

    for(const [key, value] of Object.entries(userLogin))
      if(value == null) {
        return res.status(400).json({
          error: `Missing '${key}' in request body`
        })
      }

    AuthService.getUserWithUserName(req.app.get('db'), userLogin.user_name)
      .then(dbUser => {
        if(!dbUser) {
          return res.status(400).json({
            error: 'Invalid username or password'
          })
        }
        return AuthService.comparePasswords(userLogin.password, dbUser.password)
          .then(compareMatch => {
            if(!compareMatch) {
              return res.status(400).json({
                error: 'Invalid username or password'
              })
            }

            const sub = dbUser.user_name
            const payload = { user_id: dbUser.id }
            res.send({
              authToken: AuthService.createJwt(sub, payload)
            })
          })
      })
      .catch(next)

    
  
  })

module.exports = authRouter