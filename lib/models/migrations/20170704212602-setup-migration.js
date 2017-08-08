'use strict';

module.exports = {
	up: function (queryInterface, Sequelize) {
		return (async () => {
			await queryInterface.createTable(
			'cameras', {
				id: {
					type: Sequelize.INTEGER,
					primaryKey: true,
					autoIncrement: true
				},
				name: Sequelize.STRING,
				createdAt: Sequelize.DATE,
				updatedAt: Sequelize.DATE
			});

			await queryInterface.createTable(
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
			});

			await queryInterface.createTable(
			'assets', {
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
				type: Sequelize.ENUM('image', 'video', 'raw'),
				format: Sequelize.STRING(10),
				width: Sequelize.INTEGER,
				height: Sequelize.INTEGER,
				orientation: Sequelize.INTEGER,
				landscape: Sequelize.BOOLEAN,
				exif: Sequelize.JSON,
				bornAt: {
					type: Sequelize.DATE,
					allowNull: false
				},
				createdAt: Sequelize.DATE,
				updatedAt: Sequelize.DATE
			});

			await queryInterface.addConstraint('assets', ['uuid'], {type: 'unique'});
			await queryInterface.addConstraint('assets', ['hash'], {type: 'unique'});

			await queryInterface.createTable(
			'instances', {
				id: {
					type: Sequelize.INTEGER,
					primaryKey: true,
					autoIncrement: true
				},
				assetId: {
					type: Sequelize.INTEGER,
					references: {
						model: 'assets',
						key: 'id'
					},
					onUpdate: 'cascade',
					onDelete: 'set null'
				},
				path: Sequelize.STRING,
				original: Sequelize.STRING,
				createdAt: Sequelize.DATE,
				updatedAt: Sequelize.DATE
			});

			await queryInterface.createTable('thumbnails', {
				id: {
					type: Sequelize.INTEGER,
					primaryKey: true,
					autoIncrement: true
				},
				uuid: {
					type: Sequelize.UUID,
					defaultValue: Sequelize.UUIDV4,
					unique: true,
					allowNull: false
				},
				assetId: {
					type: Sequelize.INTEGER,
					referenced: {
						model: 'assets',
						key: 'id'
					},
					onUpdate: 'cascade',
					onDelete: 'set null'
				},
				format: Sequelize.STRING(10),
				size: Sequelize.INTEGER,
				width: Sequelize.INTEGER,
				height: Sequelize.INTEGER,
				createdAt: Sequelize.DATE,
				updatedAt: Sequelize.DATE
			});
		})();
	},

	down: function (queryInterface, Sequelize) {
		return queryInterface.dropAllTables();
	}
};
