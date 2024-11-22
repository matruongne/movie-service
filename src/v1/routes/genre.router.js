const express = require('express')
const genreController = require('../controllers/genre.controller')
const genresRouter = express.Router()

genresRouter.get('/', genreController.getAllGenres)
genresRouter.get('/:genreId', genreController.getGenreById)
genresRouter.post('/new', genreController.createGenre)
genresRouter.patch('/:genreId', genreController.updateGenre)
genresRouter.delete('/:genreId', genreController.deleteGenre)

module.exports = genresRouter
