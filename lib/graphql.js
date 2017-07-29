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
				resolve: resolver(db.Photo.Locations)
			},
			thumbnails: {
				type: PhotoThumbnail.connectionType,
				args: PhotoThumbnail.connectionArgs,
				resolve: resolver(db.Photo.Thumbnails)
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
		name: "Moment",
		description: "Moments",
		fields: () => Object.assign(attributeFields(db.Moment), {
			id: globalIdField(db.Moment.id),
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
		})
	});

	return new graphql.Schema({
		query: new graphql.ObjectType({
			name: 'RootQueryType',
			fields: {
				moments: {
					type: new graphql.List(Moment),
					args: defaultListArgs(),
					resolve: resolver(db.Moment)
				},
				photos: {
					type: new graphql.List(Photo),
					args: defaultListArgs(),
					resolve: resolver(db.Photo)
				}
			}
		})
	});
};
