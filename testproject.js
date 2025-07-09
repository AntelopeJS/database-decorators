const { MongoMemoryServer } = require('mongodb-memory-server-core');

let mongod;

module.exports.setup = async function() {
	mongod = await MongoMemoryServer.create();

	return {
		cacheFolder: '.antelope/cache',
		modules: {
			local: {
				source: {
					type: 'local',
					path: '.',
				},
			},
			mongodb: {
				source: {
					type: 'git',
					remote: 'git@github.com:AntelopeJS/mongodb.git',
					branch: 'main',
					installCommand: ['pnpm i', 'npx tsc'],
				},
				config: {
					url: mongod.getUri(),
				},
			},
			api: {
				source: {
					type: 'git',
					remote: 'git@github.com:AntelopeJS/api.git',
					branch: 'main',
					installCommand: ['pnpm i', 'npx tsc'],
				},
				config: {
					servers: [
						{
							protocol: 'http',
							port: '5010',
						},
					],
				},
			},
		},
	};
};

module.exports.cleanup = async function() {
	await mongod.stop();
};

