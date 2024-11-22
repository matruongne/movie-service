const express = require('express')
const actorController = require('../controllers/actor.controller')
const actorsRouter = express.Router()

actorsRouter.get('/', actorController.getAllActors)
actorsRouter.get('/:actorId', actorController.getActorById)
actorsRouter.post('/new', actorController.createActor)
actorsRouter.patch('/:actorId', actorController.updateActor)
actorsRouter.delete('/:actorId', actorController.deleteActor)

module.exports = actorsRouter
