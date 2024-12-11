const { Op } = require('sequelize')
const Actor = require('../models/actor.model')
const Genre = require('../models/genre.model')
const Movie = require('../models/movie.model')
const { REDIS_GET, REDIS_SETEX, REDIS_DEL, REDIS_KEYS } = require('./redis.service')

class movieService {
	async getMovies({ search = '', sort = 'title', order = 'ASC', page = 1, limit = 10 }) {
		try {
			const offset = (page - 1) * limit
			const cacheKey = `movies:${search}:${sort}:${order}:${page}:${limit}`
			const cachedMovies = JSON.parse(await REDIS_GET(cacheKey))

			if (cachedMovies) {
				console.log('Cache hit: Movies')
				return cachedMovies
			}
			console.log('Cache miss: Movies')
			const movies = await Movie.findAndCountAll({
				distinct: true, // Loại bỏ trùng lặp
				col: 'movie_id',
				include: [
					{ model: Genre, attributes: ['genre_id', 'genre_name'], through: { attributes: [] } },
					{ model: Actor, attributes: ['actor_id', 'name'], through: { attributes: ['role'] } },
				],
				where: {
					[Op.or]: [
						{ title: { [Op.like]: `%${search}%` } },
						{ description: { [Op.like]: `%${search}%` } },
						{ director: { [Op.like]: `%${search}%` } },
					],
				},
				order: [[sort, order.toUpperCase()]],
				limit,
				offset,
			})

			const response = {
				totalItems: movies.count,
				totalPages: Math.ceil(movies.count / limit),
				currentPage: page,
				items: movies.rows,
			}

			// Cache the response
			await REDIS_SETEX(cacheKey, 3600, JSON.stringify(response))
			return response
		} catch (error) {
			console.error('Error in fetch movies:', error.message)

			throw new Error('Failed to fetch movies.')
		}
	}

	async createMovie({
		title,
		description,
		release_date,
		duration,
		director,
		language,
		poster_url,
		trailer_url,
		genres,
		actors,
	}) {
		try {
			const newMovie = await Movie.create({
				title,
				description,
				release_date,
				duration,
				director,
				language,
				poster_url,
				trailer_url,
			})

			if (genres?.length) {
				const genreInstances = await Genre.findAll({ where: { genre_id: genres } })
				if (genreInstances.length !== genres.length) {
					throw new Error('One or more genres are invalid.')
				}
				await newMovie.addGenres(genreInstances)
			}

			if (actors?.length) {
				for (const actor of actors) {
					const { actor_id, role } = actor
					const actorInstance = await Actor.findByPk(actor_id)
					if (!actorInstance) {
						throw new Error(`Actor with ID ${actor_id} not found.`)
					}
					await newMovie.addActor(actorInstance, { through: { role } })
				}
			}

			const pattern = 'movies:*'
			const keys = await REDIS_KEYS(pattern)

			for (const key of keys) {
				await REDIS_DEL(key)
			}

			const cacheKey = `movie:${newMovie.movie_id}`
			await REDIS_SETEX(cacheKey, 3600, JSON.stringify(newMovie))

			return newMovie
		} catch (error) {
			console.error('Error in create:', error.message)

			throw new Error('Failed to create movie.')
		}
	}

	async updateMovie({ movieId, updates }) {
		try {
			const { genres, actors, ...movieUpdates } = updates

			const movie = await Movie.findByPk(movieId)
			if (!movie) {
				throw new Error(`Movie with ID ${movieId} not found.`)
			}

			await movie.update(movieUpdates)

			if (genres?.length) {
				const genreInstances = await Genre.findAll({ where: { genre_id: genres } })
				if (genreInstances.length !== genres.length) {
					throw new Error('One or more genres are invalid.')
				}
				await movie.setGenres(genreInstances)
			}

			if (actors?.length) {
				const actorInstances = []
				for (const actor of actors) {
					const { actor_id, role } = actor
					const actorInstance = await Actor.findByPk(actor_id)
					if (!actorInstance) {
						throw new Error(`Actor with ID ${actor_id} not found.`)
					}
					actorInstances.push({ actorInstance, role })
				}

				await movie.setActors([])

				for (const { actorInstance, role } of actorInstances) {
					await movie.addActor(actorInstance, { through: { role } })
				}
			}

			const pattern = 'movies:*'
			const keys = await REDIS_KEYS(pattern)

			for (const key of keys) {
				await REDIS_DEL(key)
			}

			const cacheKey = `movie:${movieId}`
			await REDIS_SETEX(cacheKey, 3600, JSON.stringify(movie))

			return movie
		} catch (error) {
			console.error('Error in update:', error.message)

			throw new Error('Failed to update movie.')
		}
	}

	async deleteMovie({ movieId }) {
		try {
			const movie = await Movie.findByPk(movieId)
			if (!movie) {
				throw new Error(`Movie with ID ${movieId} not found.`)
			}

			await movie.destroy()

			const pattern = 'movies:*'
			const keys = await REDIS_KEYS(pattern)

			for (const key of keys) {
				await REDIS_DEL(key)
			}

			await REDIS_DEL(`movie:${movieId}`)

			return { message: 'Movie deleted successfully.' }
		} catch (error) {
			console.error('Error in deleteMovie:', error.message)
			throw new Error('Failed to delete movie.')
		}
	}

	async getMovieById({ movieId }) {
		try {
			const cacheKey = `movie:${movieId}`
			const cachedMovie = JSON.parse(await REDIS_GET(cacheKey))

			if (cachedMovie) {
				console.log('Cache hit: Movie')
				return cachedMovie
			}

			console.log('Cache miss: Movie')

			const movie = await Movie.findByPk(movieId, {
				include: [
					{ model: Genre, attributes: ['genre_id', 'genre_name'], through: { attributes: [] } },
					{ model: Actor, attributes: ['actor_id', 'name'], through: { attributes: ['role'] } },
				],
			})

			if (!movie) {
				throw new Error(`Movie with ID ${movieId} not found.`)
			}
			await REDIS_SETEX(cacheKey, 3600, JSON.stringify(movie))
			return movie
		} catch (error) {
			console.error('Error in fetch movie:', error.message)

			throw new Error('Failed to fetch movie.')
		}
	}
}

module.exports = new movieService()
