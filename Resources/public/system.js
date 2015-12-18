System.config({
    baseURL: './bundles',
    transpiler: 'typescript',
    packages: {
        'jarves/': {
            defaultExtension: 'ts'
        }
    },

    typescriptOptions: {
        //"noImplicitAny": true,
        //"module": "system",
        //"isolatedModules": true,
        "emitDecoratorMetadata": true,
    }
});