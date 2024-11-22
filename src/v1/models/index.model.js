const Movie = require('./movie.model')
const Genre = require('./genre.model')
const Actor = require('./actor.model')
const MovieGenre = require('./movie_genres.model')
const MovieActor = require('./movie_actors.model')

// Movie -> Genres (many-to-many)
Movie.belongsToMany(Genre, { through: MovieGenre, foreignKey: 'movie_id' })
Genre.belongsToMany(Movie, { through: MovieGenre, foreignKey: 'genre_id' })

// Movie -> Actors (many-to-many)
Movie.belongsToMany(Actor, { through: MovieActor, foreignKey: 'movie_id' })
Actor.belongsToMany(Movie, { through: MovieActor, foreignKey: 'actor_id' })

module.exports = {
	Movie,
	Genre,
	Actor,
	MovieGenre,
	MovieActor,
}
