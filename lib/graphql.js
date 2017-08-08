'use strict';

const {
	attributeFields,
	defaultArgs,
	defaultListArgs,
	relay,
	resolver,
	typeMapper
} = require('graphql-sequelize');

const {GraphQLDateTime} = require('graphql-iso-date');

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

	typeMapper.mapType((type) => {
		if (type instanceof db.Sequelize.DATE) {
			return GraphQLDateTime
		}

		return false
	});

	const Instance = new graphql.ObjectType({
		name: "Instance",
		description: "Instance of photo",
		fields: () => Object.assign(attributeFields(db.Instance), {
			id: globalIdField('Instance'),
			asset: {
				type: Asset,
				description: "The asset this location holds",
				resolve: resolver(db.Instance.Asset)
			}
		})
	});

	const AssetInstance = relay.sequelizeConnection({
		name: 'AssetInstance',
		nodeType: Instance,
		target: db.Asset.Instances
	});

	const Thumbnail = new graphql.ObjectType({
		name: "Thumbnail",
		description: "Photo thumbnail",
		fields: () => Object.assign(attributeFields(db.Thumbnail), {
			id: globalIdField('Thumbnail'),
			url: {
				type: graphql.String,
				resolve(thumb) {
					return `/thumbs/${thumb.uuid}`;
				}
			}
		})
	});

	const AssetThumbnail = relay.sequelizeConnection({
		name: 'AssetThumbnail',
		nodeType: Thumbnail,
		target: db.Asset.Thumbnails
	});

	const Asset = new graphql.ObjectType({
		name: "Asset",
		description: "An asset",
		fields: Object.assign(attributeFields(db.Asset), {
			id: globalIdField('Asset'),
			url: {
				type: graphql.String,
				resolve(asset) {
					return `/assets/${asset.uuid}`;
				}
			},
			instances: {
				type: AssetInstance.connectionType,
				args: AssetInstance.connectionArgs,
				resolve: AssetInstance.resolve
			},
			thumbnails: {
				type: AssetThumbnail.connectionType,
				args: AssetThumbnail.connectionArgs,
				resolve: AssetThumbnail.resolve
			},
			thumbnail: {
				args: {
					size: {
						type: graphql.Int,
						defaultValue: db.Thumbnail.sizes.reduce((result, v) => result = Math.min(result, v))
					}
				},
				type: Thumbnail,
				resolve: (asset, args) => {
					return db.Thumbnail.findOne({
						where: {
							assetId: asset.id,
							size: { $gte: args.size }
						},
						order: [['size', 'ASC']]
					});
				}
			}
		}),
		interfaces: [nodeInterface]
	});

	const MomentAsset = relay.sequelizeConnection({
		name: 'MomentAsset',
		nodeType: Asset,
		target: db.Moment.Assets
	});

	const Moment = new graphql.ObjectType({
		name: 'Moment',
		description: "Moments",
		fields: () => Object.assign(attributeFields(db.Moment), {
			id: globalIdField('Moment'),
			lead: {
				type: Asset,
				resolve(moment) {
					return db.Asset.findOne({
						where: {
							momentId: moment.id
						}
					});
				}
			},
			assets: {
				type: MomentAsset.connectionType,
				args: MomentAsset.connectionArgs,
				resolve: resolver(db.Moment.Assets)
			},
		}),
		interfaces: [nodeInterface]
	});

	const Moments = relay.sequelizeConnection({
		name: 'Moments',
		nodeType: Moment,
		target: db.Moment,
		orderBy: new graphql.EnumType({
			name: 'MomentsOrderBy',
			values: {
				TAKEN: {value: ['end', 'DESC']},
				ADDED: {value: ['createdAt', 'DESC']}
			}
		})
	});
/*
	const Photos = relay.sequelizeConnection({
		name: 'Photos',
		nodeType: Photo,
		target: db.Photo
	});
*/
	nodeTypeMapper.mapTypes({
		['Moment']: Moment,
//		['Photo']: Photo
	});

	const Viewer = new graphql.ObjectType({
		name: 'Viewer',
		fields: {
			moments: {
				type: Moments.connectionType,
				args: Moments.connectionArgs,
				resolve: Moments.resolve
			},
/*			photos: {
				type: Photos.connectionType,
				args: Photos.connectionArgs,
				resolve: Photos.resolve
			}
*/		}
	});

	return new graphql.Schema({
		query: new graphql.ObjectType({
			name: 'RootQueryType',
			fields: {
				viewer: {
					type: Viewer,
					resolve: () => {
						// there is no viewer scope, yet. Someday this may be a User
						return {};
					}
				}
			}
		})
	});
};
