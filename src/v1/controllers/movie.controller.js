const movieService = require('../services/movie.service')
const bindMethodsWithThisContext = require('../utils/classes/bindMethodsWithThisContext')
const BasicController = require('../utils/controllers/basicController')

class movieController extends BasicController {
	constructor() {
		super()
		bindMethodsWithThisContext(this)
	}
	async getMovies(req, res) {
		try {
			const { search } = req.query
			const response = await movieService.getMovies({ search, ...req.body })
			if (!response) {
				return res.status(404).json({ message: 'Movies not found.' })
			}
			res.json(response)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async getMovieById(req, res) {
		try {
			const { movieId } = req.params
			const movie = await movieService.getMovieById({ movieId })
			if (!movie) {
				return res.status(404).json({ message: 'Movie not found.' })
			}
			res.json(movie)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async createMovie(req, res) {
		try {
			const movieData = req.body
			const newMovie = await movieService.createMovie(movieData)
			res.status(201).json(newMovie)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async updateMovie(req, res) {
		try {
			const { movieId } = req.params
			const updates = req.body
			const updatedMovie = await movieService.updateMovie({ movieId, updates })
			res.json(updatedMovie)
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}

	async deleteMovie(req, res) {
		const { movieId } = req.params
		const result = await movieService.deleteMovie({ movieId })
		res.json(result)
		try {
		} catch (error) {
			return this.handleResponseError(res, error)
		}
	}
}

module.exports = new movieController()
