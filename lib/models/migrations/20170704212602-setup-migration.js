'use strict';

module.exports = {
	up: function (queryInterface, Sequelize) {
		return queryInterface.createTable(
			'cameras', {
				id: {
					type: Sequelize.INTEGER,
					primaryKey: true,
					autoIncrement: true
				},
				name: Sequelize.STRING,
				createdAt: Sequelize.DATE,
				updatedAt: Sequelize.DATE
			}
		).then(cameras => queryInterface.createTable(
			'moments', {
				id: {
					type: Sequelize.INTEGER,
					primaryKey: true,
					autoIncrement: true
				},
				cameraId: {
					type: Sequelize.INTEGER,
					allowNull: true,
					references: {
						model: 'cameras',
						key: 'id'
					},
					onUpdate: 'cascade',
					onDelete: 'set null'
				},
				name: {
					type: Sequelize.STRING,
					allowNull: true
				},
				start: {
					type: Sequelize.DATE,
					allowNull: false
				},
				end: {
					type: Sequelize.DATE,
					allowNull: false
				},
				createdAt: Sequelize.DATE,
				updatedAt: Sequelize.DATE
			}
		)).then(moments => queryInterface.createTable(
			'photos', {
				id: {
					type: Sequelize.INTEGER,
					primaryKey: true,
					autoIncrement: true
				},
				momentId: {
					type: Sequelize.INTEGER,
					references: {
						model: 'moments',
						key: 'id'
					},
					onUpdate: 'cascade',
					onDelete: 'set null'
				},
				uuid: {
					type: Sequelize.UUID,
					defaultValue: Sequelize.UUIDV4,
					unique: true,
					allowNull: false
				},
				hash: {
					type: Sequelize.STRING(128),
					unique: true,
					allowNull: false
				},
				type: Sequelize.STRING(6),
				width: Sequelize.INTEGER,
				height: Sequelize.INTEGER,
				takenAt: {
					type: Sequelize.DATE,
					allowNull: false
				},
				createdAt: Sequelize.DATE,
				updatedAt: Sequelize.DATE
			}
		))
		.then(photos => queryInterface.addConstraint('photos', ['uuid'], {type: 'unique'}))
		.then(index => queryInterface.addConstraint('photos', ['hash'], {type: 'unique'}))
		.then(_ => queryInterface.createTable(
			'relatives', {
				id: {
					type: Sequelize.INTEGER,
					primaryKey: true,
					autoIncrement: true
				},
				photoId: {
					type: Sequelize.INTEGER,
					references: {
						model: 'photos',
						key: 'id'
					},
					onUpdate: 'cascade',
					onDelete: 'set null'
				},
				path: Sequelize.STRING,
				original: Sequelize.STRING,
				name: Sequelize.STRING,
				createdAt: Sequelize.DATE,
				updatedAt: Sequelize.DATE
			}
		)).then(_ => queryInterface.createTable(
			'locations', {
				id: {
					type: Sequelize.INTEGER,
					primaryKey: true,
					autoIncrement: true
				},
				photoId: {
					type: Sequelize.INTEGER,
					references: {
						model: 'photos',
						key: 'id'
					},
					onUpdate: 'cascade',
					onDelete: 'set null'
				},
				path: Sequelize.STRING,
				original: Sequelize.STRING,
				createdAt: Sequelize.DATE,
				updatedAt: Sequelize.DATE
			}
		));
	},

	down: function (queryInterface, Sequelize) {
		return queryInterface.dropAllTables();
	}
};
