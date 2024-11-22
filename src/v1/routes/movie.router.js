const express = require('express')
const movieController = require('../controllers/movie.controller')
const moviesRouter = express.Router()

moviesRouter.get('/', movieController.getMovies)
moviesRouter.get('/:movieId', movieController.getMovieById)
moviesRouter.post('/new', movieController.createMovie)
moviesRouter.patch('/:movieId', movieController.updateMovie)
moviesRouter.delete('/:movieId', movieController.deleteMovie)

module.exports = moviesRouter
