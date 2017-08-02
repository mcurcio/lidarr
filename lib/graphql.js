'use strict';

const {
	attributeFields,
	defaultArgs,
	defaultListArgs,
	relay,
	resolver
} = require('graphql-sequelize');

const _graphql = require('graphql');
const graphql = {};
for (let key in _graphql) {
	if (_graphql.hasOwnProperty(key)) {
		if (key.startsWith("GraphQL")) {
			let newKey = key.substr(7);
			graphql[newKey] = _graphql[key];
		}
	}
}

const graphQlRelay = require('graphql-relay');
const globalIdField = graphQlRelay.globalIdField;

module.exports = (env) => {
	const {db, logger} = env;

	const {
		nodeInterface,
		nodeField,
		nodeTypeMapper
	} = relay.sequelizeNodeInterface(db);

	const Location = new graphql.ObjectType({
		name: "Location",
		description: "Location of photo",
		fields: () => Object.assign(attributeFields(db.Location), {
			id: globalIdField(db.Location.id),
			photo: {
				type: Photo,
				description: "The photo this location holds",
				resolve: resolver(db.Location.Photo)
			}
		})
	});

	const PhotoLocation = relay.sequelizeConnection({
		name: 'PhotoLocation',
		nodeType: Location,
		target: db.Photo.Locations
	});

	const Thumbnail = new graphql.ObjectType({
		name: "Thumbnail",
		description: "Photo thumbnail",
		fields: () => Object.assign(attributeFields(db.Thumbnail), {
			id: globalIdField(db.Thumbnail.id),
			url: {
				type: graphql.String,
				resolve(thumbnail) {
					return `/assets/thumb/${thumbnail.uuid}`;
				}
			}
		})
	});

	const PhotoThumbnail = relay.sequelizeConnection({
		name: 'PhotoThumbnail',
		nodeType: Thumbnail,
		target: db.Photo.Thumbnails
	});

	const Photo = new graphql.ObjectType({
		name: "Photo",
		description: "A photo",
		fields: Object.assign(attributeFields(db.Photo), {
			id: globalIdField(db.Photo.id),
			url: {
				type: graphql.String,
				resolve(photo) {
					return `/assets/photo/${photo.uuid}`;
				}
			},
			locations: {
				type: PhotoLocation.connectionType,
				args: PhotoLocation.connectionArgs,
				resolve: PhotoLocation.resolve
			},
			thumbnails: {
				type: PhotoThumbnail.connectionType,
				args: PhotoThumbnail.connectionArgs,
				resolve: PhotoThumbnail.resolve
			},
			thumbnail: {
				args: {
					size: {
						type: graphql.Int,
						defaultValue: db.Thumbnail.sizes.reduce((result, v) => result = Math.min(result, v))
					}
				},
				type: Thumbnail,
				resolve: (photo, args) => {
					return db.Thumbnail.findOne({
						where: {
							photoId: photo.id,
							size: { $gte: args.size }
						},
						order: [['size', 'ASC']]
					});
				}
			}
		}),
		interfaces: [nodeInterface]
	});

	const MomentPhoto = relay.sequelizeConnection({
		name: 'MomentPhoto',
		nodeType: Photo,
		target: db.Moment.Photos
	});

	const Moment = new graphql.ObjectType({
		name: db.Moment.name,
		description: "Moments",
		fields: () => Object.assign(attributeFields(db.Moment), {
			id: globalIdField(db.Moment.name),
			lead: {
				type: Photo,
				resolve(moment) {
					return db.Photo.findOne({
						where: {
							momentId: moment.id
						}
					});
				}
			},
			photos: {
				type: MomentPhoto.connectionType,
				args: MomentPhoto.connectionArgs,
				resolve: resolver(db.Moment.Photos)
			},
		}),
		interfaces: [nodeInterface]
	});

	const Moments = relay.sequelizeConnection({
		name: 'Moments',
		nodeType: Moment,
		target: db.Moment,
		connectionFields: {
			total: {
				type: graphql.Int,
				resolve: ({fullCount}) => {
					return fullCount;
				}
			},
			totalPages: {
				type: graphql.Int,
				resolve: ({args, where, edges, fullCount}) => {
					return Math.ceil(fullCount / edges.length);
				}
			},
			currentPage: {
				type: graphql.Int,
				resolve: async ({args, where, edges, fullCount}) => {
					const edge = edges[0];
					if (!edge) {
						return null;
					}
					const moment = edge.node;
					if (!moment) {
						return null;
					}
					const count = await db.Moment.count({
						where: {
							'id': {$lt: moment.id}
						}
					});
					return Math.min(count / edges.length);
					//console.log('count', count);
					//console.log('edges', moment.get({plain:true}));
					//return -1;
				}
			}
		}
	});

	const Photos = relay.sequelizeConnection({
		name: 'Photos',
		nodeType: Photo,
		target: db.Photo
	});

	nodeTypeMapper.mapTypes({
		[db.Moment.name]: Moment,
		[db.Photo.name]: Photo
	});

	return new graphql.Schema({
		query: new graphql.ObjectType({
			name: 'RootQueryType',
			fields: {
				moments: {
					type: Moments.connectionType,
					args: Moments.connectionArgs,
					resolve: Moments.resolve
				},
				photos: {
					type: Photos.connectionType,
					args: Photos.connectionArgs,
					resolve: Photos.resolve
				}
			}
		})
	});
};
